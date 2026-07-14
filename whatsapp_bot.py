import calendar
import json
import os
import re
from datetime import date, datetime
from urllib.parse import parse_qs

from portal_settings import render_template

import uuid

async def create_request(data: dict) -> dict:
    from database import appointment_requests_collection, patients_collection
    
    phone = data.get("contact_number", "")
    patient = await patients_collection.find_one({"metadata.contact": phone})
    patient_id = patient["metadata"]["id"] if patient else ""

    req = {
        "requestId": str(uuid.uuid4())[:8].upper(),
        "patientName": data.get("patient_name", "Unknown"),
        "contact": phone,
        "patientId": patient_id,
        "age": data.get("age", ""),
        "preferredDate": data.get("preferred_date", ""),
        "preferredTime": data.get("preferred_slot", ""),
        "concern": data.get("concern", ""),
        "status": "Pending",
        "createdAt": datetime.now().isoformat()
    }
    await appointment_requests_collection.insert_one(req)
    req.pop("_id", None)
    return req



BASE_DIR = os.path.dirname(__file__)
STATE_FILE = os.path.join(BASE_DIR, "conversation_state.json")

VALID_GREETING = {"hi", "hello", "hey"}
VALID_SLOTS = {"morning": "Morning", "afternoon": "Afternoon", "evening": "Evening"}


def _load_state() -> dict:
    if not os.path.exists(STATE_FILE):
        return {}
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_state(state: dict) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)



def _set_patient_state(phone: str, status: str, data: dict | None = None) -> None:
    state = _load_state()
    state[phone] = {"status": status, "data": data or {}}
    _save_state(state)


def _clear_patient_state(phone: str) -> None:
    state = _load_state()
    state.pop(phone, None)
    _save_state(state)


def _valid_contact(text: str) -> bool:
    return bool(re.fullmatch(r"\d{10}", text.strip()))


def _valid_age(text: str) -> bool:
    if not text.isdigit():
        return False
    age = int(text)
    return 0 < age <= 120


def _parse_request_date(text: str) -> date | None:
    try:
        return datetime.strptime(text.strip(), "%d/%m/%Y").date()
    except ValueError:
        return None


def _valid_request_date(text: str) -> bool:
    requested = _parse_request_date(text)
    if requested is None:
        return False

    today = date.today()
    month_index = today.month + 2 - 1
    max_year = today.year + month_index // 12
    max_month = month_index % 12 + 1
    max_day = date(max_year, max_month, min(today.day, calendar.monthrange(max_year, max_month)[1]))
    return today <= requested <= max_day


def _menu_choice(text: str) -> str:
    match = re.search(r"[1-5]", text or "")
    return match.group(0) if match else ""


import whatsapp_service

async def handle_incoming_message(phone: str, message: str) -> dict:
    phone = str(phone or "").strip()
    message = str(message or "").strip()
    lower = message.lower()

    state = _load_state()
    current = state.get(phone, {"status": "MENU", "data": {}})
    status = current.get("status", "MENU")
    data = current.get("data", {})
    choice = _menu_choice(message)

    if lower == "stop" or message == "btn_stop":
        from database import patients_collection, pregnancy_templates_collection
        patient = await patients_collection.find_one({"metadata.contact": phone})
        if patient:
            await patients_collection.update_one({"_id": patient["_id"]}, {"$set": {"metadata.receive_msgs": False}})
        stop_tmpl = await pregnancy_templates_collection.find_one({"week": "stop_msg"})
        msg = stop_tmpl["message"] if stop_tmpl else "Okay messages are stopped."
        return await whatsapp_service.send_text(phone, msg)
        
    if lower == "start" or message == "btn_start":
        from database import patients_collection, pregnancy_templates_collection
        patient = await patients_collection.find_one({"metadata.contact": phone})
        if patient:
            await patients_collection.update_one({"_id": patient["_id"]}, {"$set": {"metadata.receive_msgs": True}})
        start_tmpl = await pregnancy_templates_collection.find_one({"week": "start_msg"})
        msg = start_tmpl["message"] if start_tmpl else "Welcome back! Messages resumed."
        return await whatsapp_service.send_text(phone, msg)

    if message == "btn_contact":
        msg = await render_template("contact_hospital")
        return await whatsapp_service.send_text(phone, msg)
        
    if lower in VALID_GREETING:
        _set_patient_state(phone, "MENU", {})
        msg = await render_template("menu")
        buttons = [
            {"id": "btn_book", "title": "Book Appointment"},
            {"id": "btn_contact", "title": "Contact Hospital"},
            {"id": "btn_stop", "title": "Stop Messages"}
        ]
        return await whatsapp_service.send_interactive_buttons(phone, msg, buttons)

    if message.startswith("FLOW_REPLY:"):
        import json
        try:
            payload_str = message.split("FLOW_REPLY:", 1)[1]
            flow_data = json.loads(payload_str)
            # Create request directly from flow data
            request = await create_request({
                "patient_name": flow_data.get("patient_name", ""),
                "contact_number": flow_data.get("contact_number", ""),
                "age": flow_data.get("age", ""),
                "preferred_date": flow_data.get("preferred_date", ""),
                "preferred_slot": flow_data.get("preferred_slot", "Morning"),
                "concern": flow_data.get("concern", "")
            })
            _clear_patient_state(phone)
            msg = await render_template("request_submitted", {"request_id": request["requestId"]})
            return await whatsapp_service.send_text(phone, msg)
        except Exception as e:
            print(f"Flow parsing error: {e}")
            return await whatsapp_service.send_text(phone, "Sorry, there was an error processing your form.")

    if status == "MENU":
        if lower == "request appointment" or message == "btn_book":
            import os
            flow_id = os.getenv("WHATSAPP_FLOW_ID")
            if flow_id:
                # Use WhatsApp Flows
                import uuid
                flow_token = str(uuid.uuid4())
                return await whatsapp_service.send_interactive_flow(
                    phone, 
                    "Please fill out the appointment request form below.", 
                    flow_id, 
                    flow_token
                )
            else:
                # Fallback to state machine if flow isn't setup
                _set_patient_state(phone, "WAITING_NAME", {})
                return await whatsapp_service.send_text(phone, "Please enter your name.")
        
        msg = await render_template("menu")
        buttons = [
            {"id": "btn_book", "title": "Book Appointment"},
            {"id": "btn_contact", "title": "Contact Hospital"},
            {"id": "btn_stop", "title": "Stop Messages"}
        ]
        return await whatsapp_service.send_interactive_buttons(phone, msg, buttons)

    if status == "WAITING_NAME":
        data["patient_name"] = message
        _set_patient_state(phone, "WAITING_CONTACT", data)
        return await whatsapp_service.send_text(phone, "Please enter your contact number.")

    if status == "WAITING_CONTACT":
        if not _valid_contact(message):
            msg = await render_template("invalid_contact")
            return await whatsapp_service.send_text(phone, msg)
        data["contact_number"] = message
        _set_patient_state(phone, "WAITING_AGE", data)
        return await whatsapp_service.send_text(phone, "Please enter your age.")

    if status == "WAITING_AGE":
        if not _valid_age(message):
            return await whatsapp_service.send_text(phone, "Please enter a valid age.")
        data["age"] = message
        _set_patient_state(phone, "WAITING_DATE", data)
        return await whatsapp_service.send_text(phone, "Please enter your preferred appointment date in DD/MM/YYYY format.")

    if status == "WAITING_DATE":
        if not _valid_request_date(message):
            msg = await render_template("invalid_date")
            return await whatsapp_service.send_text(phone, msg)
        data["preferred_date"] = message
        _set_patient_state(phone, "WAITING_SLOT", data)
        
        sections = [
            {
                "title": "Available Slots",
                "rows": [
                    {"id": "row_morning", "title": "Morning"},
                    {"id": "row_afternoon", "title": "Afternoon"},
                    {"id": "row_evening", "title": "Evening"}
                ]
            }
        ]
        return await whatsapp_service.send_interactive_list(phone, "Please choose a slot.", "View Slots", sections)

    if status == "WAITING_SLOT":
        # Handle list selection (id) or text fallback
        if message == "row_morning":
            slot = "Morning"
        elif message == "row_afternoon":
            slot = "Afternoon"
        elif message == "row_evening":
            slot = "Evening"
        else:
            slot = VALID_SLOTS.get(lower)
            
        if not slot:
            sections = [
                {
                    "title": "Available Slots",
                    "rows": [
                        {"id": "row_morning", "title": "Morning"},
                        {"id": "row_afternoon", "title": "Afternoon"},
                        {"id": "row_evening", "title": "Evening"}
                    ]
                }
            ]
            return await whatsapp_service.send_interactive_list(phone, "Please choose one of the available slots.", "View Slots", sections)
            
        data["preferred_slot"] = slot
        _set_patient_state(phone, "WAITING_CONCERN", data)
        return await whatsapp_service.send_text(phone, "Please enter your concern / reason for appointment.")

    if status == "WAITING_CONCERN":
        data["concern"] = message
        request = await create_request(data)
        _clear_patient_state(phone)
        msg = await render_template(
            "request_submitted", {"request_id": request["requestId"]}
        )
        return await whatsapp_service.send_text(phone, msg)

    _set_patient_state(phone, "MENU", {})
    msg = await render_template("menu")
    buttons = [
        {"id": "btn_book", "title": "Book Appointment"},
        {"id": "btn_contact", "title": "Contact Hospital"},
        {"id": "btn_stop", "title": "Stop Messages"}
    ]
    return await whatsapp_service.send_interactive_buttons(phone, msg, buttons)
