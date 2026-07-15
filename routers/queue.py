from fastapi import APIRouter, HTTPException, Request
from database import (
    queue_collection, 
    patients_collection, 
    scheduled_appointments_collection, 
    past_appointments_collection
)
from models import QueueEntry
import uuid
from datetime import datetime

router = APIRouter(prefix="/queue-api", tags=["Queue"])

@router.get("/")
async def get_queue():
    # Return all queue items (scheduler clears it at midnight, so this is today's queue)
    cursor = queue_collection.find({}, {"_id": 0}).sort("sr_no", 1)
    return await cursor.to_list(length=None)

@router.post("/")
async def add_to_queue(req: Request):
    payload = await req.json()
    
    # Generate ID if missing
    if "id" not in payload or not payload["id"]:
        payload["id"] = f"Q-{str(uuid.uuid4())[:8].upper()}"
        
    # Get max sr_no
    last_item = await queue_collection.find_one({}, sort=[("sr_no", -1)])
    next_sr_no = 1
    if last_item and "sr_no" in last_item:
        next_sr_no = last_item["sr_no"] + 1
        
    payload["sr_no"] = next_sr_no
    payload["addedAt"] = datetime.now().isoformat()
    payload["status"] = "Waiting"
    
    entry = QueueEntry(**payload)
    doc = entry.model_dump(by_alias=True)
    
    await queue_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{entry_id}/complete")
async def complete_queue_entry(entry_id: str):
    entry = await queue_collection.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
        
    if entry.get("status") == "Completed":
        return entry
        
    completed_time = datetime.now()
    completed_at = completed_time.isoformat()
    today_str = completed_time.strftime("%Y-%m-%d")
    now_time = completed_time.strftime("%I:%M %p")
    
    wait_time_minutes = 0
    if entry.get("addedAt"):
        try:
            added_time = datetime.fromisoformat(entry.get("addedAt").replace("Z", "+00:00"))
            # If the added_time is naive (has no tzinfo), we should make sure completed_time is also naive
            # or if it's aware, we use aware for both.
            # Assuming both are naive or both are aware based on how they were generated.
            # Let's just use a robust calculation:
            if added_time.tzinfo is not None:
                completed_time = completed_time.astimezone(added_time.tzinfo)
            wait_time_minutes = int((completed_time - added_time).total_seconds() / 60)
        except Exception:
            pass
            
    # 1. Update queue entry
    await queue_collection.update_one(
        {"id": entry_id}, 
        {"$set": {"status": "Completed", "completedAt": completed_at}}
    )
    entry["status"] = "Completed"
    entry["completedAt"] = completed_at
    
    # 2. If it's a Patient, update Patient history and associated Scheduled Appointment
    if entry.get("type") == "Patient" and entry.get("patientId"):
        pid = entry["patientId"]
        
        # Append visit to patient history
        visit_record = {
            "date": today_str,
            "type": "Consultation",
            "notes": entry.get("notes", "")
        }
        await patients_collection.update_one(
            {"metadata.id": pid},
            {"$push": {"visits": visit_record}, "$set": {"metadata.last_visit": today_str}}
        )
        
        # Check if there's a scheduled appointment for today for this patient
        scheduled = await scheduled_appointments_collection.find_one({
            "patientId": pid,
            "appointmentDate": today_str
        })
        
        if scheduled:
            # Move to past appointments
            scheduled["status"] = "Completed"
            scheduled["completedAt"] = completed_at
            scheduled["wait_time_minutes"] = wait_time_minutes
            
            # Avoid duplicate _id error
            if "_id" in scheduled:
                del scheduled["_id"]
                
            await past_appointments_collection.insert_one(scheduled)
            await scheduled_appointments_collection.delete_one({"id": scheduled["id"]})
        else:
            # Generate a new past appointment for the walk-in
            import uuid
            new_past_appt = {
                "id": str(uuid.uuid4()),
                "patientId": pid,
                "patientName": entry.get("name", ""),
                "contact": entry.get("contact", ""),
                "age": entry.get("age", ""),
                "concern": entry.get("notes", ""),
                "status": "Completed",
                "appointmentDate": today_str,
                "appointmentTime": datetime.now().strftime("%H:%M"),
                "createdAt": completed_at,
                "completedAt": completed_at,
                "wait_time_minutes": wait_time_minutes
            }
            await past_appointments_collection.insert_one(new_past_appt)

    return entry

@router.put("/reorder")
async def reorder_queue(req: Request):
    # payload is a list of IDs in the new correct order
    payload = await req.json()
    if not isinstance(payload, list):
        raise HTTPException(status_code=400, detail="Expected list of IDs")
        
    for index, entry_id in enumerate(payload):
        # sr_no is 1-indexed
        await queue_collection.update_one({"id": entry_id}, {"$set": {"sr_no": index + 1}})
        
    return {"message": "Reordered successfully"}

@router.put("/{entry_id}/revert")
async def revert_queue_entry(entry_id: str):
    entry = await queue_collection.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
        
    if entry.get("status") != "Completed":
        return entry
        
    if entry.get("type") == "Patient" and entry.get("patientId"):
        pid = entry["patientId"]
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        past_appt = await past_appointments_collection.find_one({
            "patientId": pid,
            "appointmentDate": today_str
        })
        
        if past_appt:
            past_appt["status"] = "Scheduled"
            past_appt.pop("completedAt", None)
            
            if "_id" in past_appt:
                del past_appt["_id"]
            
            await scheduled_appointments_collection.insert_one(past_appt)
            await past_appointments_collection.delete_one({"id": past_appt["id"]})
        
        await patients_collection.update_one(
            {"metadata.id": pid},
            {"$pull": {"visits": {"date": today_str, "type": "Consultation"}}}
        )

    await queue_collection.update_one(
        {"id": entry_id}, 
        {"$set": {"status": "Waiting"}, "$unset": {"completedAt": ""}}
    )
    
    return {"message": "Reverted successfully"}

@router.delete("/{entry_id}")
async def delete_queue_entry(entry_id: str):
    entry = await queue_collection.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
        
    if entry.get("status") == "Completed" and entry.get("type") == "Patient" and entry.get("patientId"):
        pid = entry["patientId"]
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        await past_appointments_collection.delete_one({
            "patientId": pid,
            "appointmentDate": today_str
        })
        
        await patients_collection.update_one(
            {"metadata.id": pid},
            {"$pull": {"visits": {"date": today_str, "type": "Consultation"}}}
        )

    await queue_collection.delete_one({"id": entry_id})
    return {"message": "Deleted"}
