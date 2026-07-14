import os
from datetime import datetime
from fastapi import APIRouter, Request, Response
from whatsapp_bot import handle_incoming_message
from database import whatsapp_logs_collection

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

@router.get("/webhook")
async def verify_webhook(req: Request):
    """Meta webhook verification"""
    mode = req.query_params.get("hub.mode")
    token = req.query_params.get("hub.verify_token")
    challenge = req.query_params.get("hub.challenge")
    
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
    
    if mode and token:
        if mode == "subscribe" and token == verify_token:
            return Response(content=challenge, media_type="text/plain")
        return Response(status_code=403)
    return Response(status_code=400)

@router.post("/webhook")
async def whatsapp_webhook(req: Request):
    try:
        body = await req.json()
    except Exception:
        return Response(status_code=400)
    
    # Dump the raw body to MongoDB so we can inspect it!
    log_entry = {
        "type": "RAW_WEBHOOK_PAYLOAD",
        "payload": body,
        "loggedAt": datetime.now().isoformat()
    }
    await whatsapp_logs_collection.insert_one(log_entry)
    
    if body.get("object") != "whatsapp_business_account":
        return Response(status_code=404)
        
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            
            # Handle incoming statuses
            if "statuses" in value:
                for status in value["statuses"]:
                    log_entry = {
                        "message_id": status.get("id"),
                        "status": status.get("status"),
                        "timestamp": status.get("timestamp"),
                        "recipient_id": status.get("recipient_id"),
                        "loggedAt": datetime.now().isoformat()
                    }
                    await whatsapp_logs_collection.insert_one(log_entry)
            
            # Handle incoming messages
            if "messages" in value:
                for message in value["messages"]:
                    phone = message.get("from")
                    
                    text = ""
                    if message.get("type") == "text":
                        text = message.get("text", {}).get("body", "")
                    elif message.get("type") == "interactive":
                        interactive = message.get("interactive", {})
                        if interactive.get("type") == "button_reply":
                            text = interactive.get("button_reply", {}).get("id", "")
                        elif interactive.get("type") == "list_reply":
                            text = interactive.get("list_reply", {}).get("id", "")
                        elif interactive.get("type") == "nfm_reply":
                            text = f"FLOW_REPLY:{interactive.get('nfm_reply', {}).get('response_json', '{}')}"
                            
                    if phone and text:
                        await handle_incoming_message(phone, text)
                        
    return Response(content="EVENT_RECEIVED", status_code=200)
@router.post("/send-pregnancy-message")
async def send_pregnancy_message(req: Request):
    payload = await req.json()
    patient_ids = payload.get("patient_ids", [])
    
    from database import patients_collection, pregnancy_templates_collection
    import whatsapp_service
    from datetime import datetime
    import math
    
    results = {}
    for pid in patient_ids:
        patient = await patients_collection.find_one({"metadata.id": str(pid)})
        if not patient:
            results[pid] = "Not found"
            continue
            
        contact = patient.get("metadata", {}).get("contact")
        due_date_str = patient.get("metadata", {}).get("expected_due_date")
        if not contact or not due_date_str:
            results[pid] = "Missing contact or due date"
            continue
            
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        except ValueError:
            results[pid] = "Invalid date format"
            continue
            
        today = datetime.now()
        days_rem = (due_date - today).days
        weeks_rem = round(days_rem / 7.0)
        week = 40 - weeks_rem
        
        if week < 1 or week > 40:
            results[pid] = "Not in weeks 1-40"
            continue
            
        template = await pregnancy_templates_collection.find_one({
            "$or": [{"week": str(week)}, {"week": week}]
        })
        if not template:
            results[pid] = f"No template for week {week}"
            continue
            
        msg = template.get("message", "")
        # Replace {patient_name} if needed
        msg = msg.replace("{patient_name}", patient.get("metadata", {}).get("name", "Patient"))
        
        res = await whatsapp_service.send_text(contact, msg)
        is_success = res.get("ok", False) or "messages" in res
        
        results[pid] = "Queued by WhatsApp" if is_success else "Failed"
        
        if is_success:
            await patients_collection.update_one(
                {"_id": patient["_id"]}, 
                {"$set": {"metadata.lastWeekSent": str(week)}}
            )
            
    return {"results": results}
