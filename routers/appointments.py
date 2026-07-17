from fastapi import APIRouter, HTTPException, Request
from database import scheduled_appointments_collection, past_appointments_collection, appointment_requests_collection
from models import ScheduledAppointment, PastAppointment, AppointmentRequest
import uuid
from datetime import datetime

router = APIRouter(tags=["Appointments"])

@router.get("/requests")
async def get_requests():
    docs = await appointment_requests_collection.find({}, {"_id": 0}).to_list(length=None)
    return docs

@router.post("/requests")
async def create_request(req: Request):
    payload = await req.json()
    # Align to Pydantic Model
    ar = AppointmentRequest(**payload)
    if not ar.id:
        ar.id = str(uuid.uuid4())[:8].upper()
    ar.createdAt = datetime.now().isoformat()
    await appointment_requests_collection.insert_one(ar.dict(by_alias=True))
    return ar.dict(by_alias=True)

@router.delete("/requests/{request_id}")
async def delete_request(request_id: str):
    res = await appointment_requests_collection.delete_one({"requestId": request_id})
    if res.deleted_count == 0:
        # Fallback to old id field if they were inserted before the migration
        res = await appointment_requests_collection.delete_one({"id": request_id})
        if res.deleted_count == 0:
            res = await appointment_requests_collection.delete_one({"request_id": request_id})
            if res.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@router.patch("/requests/{request_id}/approve")
async def approve_request(request_id: str, req: Request):
    payload = await req.json()
    
    # 1. Update the request status
    r = await appointment_requests_collection.find_one({
        "$or": [{"requestId": request_id}, {"id": request_id}, {"request_id": request_id}]
    })
    
    if not r:
        raise HTTPException(status_code=404, detail="Request not found")
        
    await appointment_requests_collection.update_one(
        {"_id": r["_id"]},
        {"$set": {"status": "Approved"}}
    )
    
    # 2. Add to scheduled appointments
    # Use camelCase for the schema
    new_appt = ScheduledAppointment(
        id=str(uuid.uuid4())[:8].upper(),
        patientId=payload.get("patientId") or r.get("patientId") or r.get("patient_id", ""),
        patientName=payload.get("patientName") or r.get("patientName") or r.get("patient_name", ""),
        age=str(r.get("age", "")),
        contact=payload.get("contact") or r.get("contact", ""),
        appointmentDate=payload.get("appointmentDate") or payload.get("appointment_date", ""),
        appointmentTime=payload.get("appointmentTime") or payload.get("appointment_time", ""),
        appointmentType=payload.get("appointmentType") or payload.get("appointment_type", "Consultation"),
        notes=payload.get("notes") or payload.get("appointment_notes", ""),
        status="Scheduled",
        createdAt=datetime.now().isoformat()
    )
    
    await scheduled_appointments_collection.insert_one(new_appt.dict())
    
    # 3. Send WhatsApp Confirmation
    phone = new_appt.contact
    if phone:
        from database import appointment_message_templates_collection
        import whatsapp_service
        
        template_doc = await appointment_message_templates_collection.find_one({"type": "confirmation"})
        if template_doc:
            message_text = template_doc.get("message", "")
            
            # Simple replacements
            message_text = message_text.replace("[Patient Name]", new_appt.patientName or "Patient")
            message_text = message_text.replace("[Date]", new_appt.appointmentDate or "")
            message_text = message_text.replace("[Time]", new_appt.appointmentTime or "")
            
            # Send via Meta API
            await whatsapp_service.send_text(phone, message_text)
            
    return {"ok": True, "appointment": new_appt.dict()}

@router.patch("/requests/{request_id}/reject")
async def reject_request(request_id: str):
    res = await appointment_requests_collection.update_one(
        {"$or": [{"requestId": request_id}, {"id": request_id}, {"request_id": request_id}]},
        {"$set": {"status": "Declined"}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@router.patch("/requests/{request_id}/dismiss")
async def dismiss_request_notification(request_id: str):
    res = await appointment_requests_collection.update_one(
        {"$or": [{"requestId": request_id}, {"id": request_id}, {"request_id": request_id}]},
        {"$set": {"notificationDismissed": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@router.get("/scheduled-appointments")
async def get_scheduled_appointments():
    return await scheduled_appointments_collection.find({}, {"_id": 0}).to_list(length=None)

@router.post("/scheduled-appointments")
async def add_scheduled_appt(req: Request):
    payload = await req.json()
    sa = ScheduledAppointment(**payload)
    if not sa.createdAt:
        sa.createdAt = datetime.now().isoformat()
    await scheduled_appointments_collection.insert_one(sa.dict())
    
    # Send WhatsApp Confirmation
    phone = sa.contact
    if phone:
        from database import appointment_message_templates_collection
        import whatsapp_service
        
        template_doc = await appointment_message_templates_collection.find_one({"type": "confirmation"})
        if template_doc:
            message_text = template_doc.get("message", "")
            message_text = message_text.replace("[Patient Name]", sa.patientName or "Patient")
            message_text = message_text.replace("[Date]", sa.appointmentDate or "")
            message_text = message_text.replace("[Time]", sa.appointmentTime or "")
            await whatsapp_service.send_text(phone, message_text)
            
    return {"ok": True, "appointment": sa.dict()}

@router.delete("/scheduled-appointments/{appointment_id}")
async def delete_scheduled_appt(appointment_id: str):
    res = await scheduled_appointments_collection.delete_one({"id": appointment_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@router.get("/past-appointments")
async def get_past_appointments():
    return await past_appointments_collection.find({}, {"_id": 0}).to_list(length=None)

@router.delete("/past-appointments/{appointment_id}")
async def delete_past_appt(appointment_id: str):
    res = await past_appointments_collection.delete_one({"id": appointment_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@router.get("/appointments/patient/{patient_id}")
async def get_patient_appointments(patient_id: str):
    scheduled = await scheduled_appointments_collection.find({"patientId": patient_id}, {"_id": 0}).to_list(length=None)
    past = await past_appointments_collection.find({"patientId": patient_id}, {"_id": 0}).to_list(length=None)
    return scheduled + past
