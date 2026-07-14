import os
import zipfile
import json
import tempfile
from datetime import datetime
import pymongo
from database import (
    portal_settings_collection, appointment_message_templates_collection,
    patients_collection, scheduled_appointments_collection, past_appointments_collection,
    appointment_requests_collection, pregnancy_templates_collection,
    conditions_config_collection, medical_history_config_collection
)

BASE_DIR = os.path.dirname(__file__)

DEFAULT_SETTINGS = {
    "theme": "light",
    "scheduler_time": "09:00 AM",
    "hospital_name": "Le Nest Hospital",
    "contact_number": "",
}

# The default templates remain the same, omitting here for brevity but will populate if DB is empty
DEFAULT_APPOINTMENT_TEMPLATES = {
    "11": {
        "id": 11,
        "name": "Bot Menu",
        "template_name": "menu",
        "message": (
            "Hello👋\n\n"
            "Welcome to {hospital_name}.\n\n"
            "How can we help you today?"
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "12": {
        "id": 12,
        "name": "Request Submitted",
        "template_name": "request_submitted",
        "message": (
            "Thank you.\n\n"
            "Your appointment request has been submitted successfully.\n\n"
            "Request ID: {request_id}\n\n"
            "Our staff will review it and contact you soon."
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "13": {
        "id": 13,
        "name": "Appointment Approved",
        "template_name": "approved",
        "message": (
            "Hello {patient_name},\n\n"
            "Your appointment request has been approved.\n\n"
            "Appointment Details:\n\n"
            "Date: {appointment_date}\n"
            "Time: {appointment_time}\n\n"
            "Please arrive 15 minutes before your scheduled time.\n\n"
            "Thank you,\n"
            "MediSync"
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "14": {
        "id": 14,
        "name": "Appointment Rejected",
        "template_name": "rejected",
        "message": (
            "Hello {patient_name},\n\n"
            "Unfortunately your appointment request could not be scheduled for the requested slot.\n\n"
            "Please submit another appointment request or contact the hospital directly.\n\n"
            "Thank you,\n"
            "MediSync"
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "15": {
        "id": 15,
        "name": "Appointment Reminder",
        "template_name": "reminder",
        "message": (
            "Hello {patient_name},\n\n"
            "This is a reminder for your appointment today.\n\n"
            "Date: {appointment_date}\n"
            "Time: {appointment_time}\n\n"
            "Please arrive 15 minutes before your scheduled time.\n\n"
            "Thank you,\n"
            "MediSync"
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "16": {
        "id": 16,
        "name": "Invalid Contact",
        "template_name": "invalid_contact",
        "message": "Please enter a valid 10-digit contact number.",
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "17": {
        "id": 17,
        "name": "Invalid Date",
        "template_name": "invalid_date",
        "message": (
            "Please enter a valid appointment date in DD/MM/YYYY format. "
            "The date cannot be in the past or more than 2 months from today."
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
    "18": {
        "id": 18,
        "name": "Contact Hospital",
        "template_name": "contact_hospital",
        "message": (
            "Please contact the hospital directly for assistance.\n\n"
            "Hospital: {hospital_name}\n"
            "Contact Number: {contact_number}"
        ),
        "type": "UTILITY",
        "approval_status": "APPROVED",
        "last_updated": "2026-06-01T10:00:00Z"
    },
}

async def load_settings() -> dict:
    doc = await portal_settings_collection.find_one({}, {"_id": 0})
    if not doc:
        # insert default
        await portal_settings_collection.insert_one(DEFAULT_SETTINGS.copy())
        return DEFAULT_SETTINGS
    return doc

async def save_settings(settings: dict) -> dict:
    # There's only one document, we can use update_one with an empty filter
    doc = await portal_settings_collection.find_one_and_update(
        {},
        {"$set": settings},
        return_document=pymongo.ReturnDocument.AFTER,
        upsert=True,
        projection={"_id": 0}
    )
    return doc

async def load_appointment_templates() -> dict:
    cursor = appointment_message_templates_collection.find({}, {"_id": 0})
    docs = await cursor.to_list(length=1000)
    if not docs:
        # insert default
        to_insert = list(DEFAULT_APPOINTMENT_TEMPLATES.values())
        await appointment_message_templates_collection.insert_many(to_insert)
        docs = to_insert
    
    # Return as dict {str(id): doc} to match old signature
    return {str(doc["id"]): doc for doc in docs}

async def update_appointment_template(template_id: str, updates: dict) -> dict | None:
    doc = await appointment_message_templates_collection.find_one_and_update(
        {"id": int(template_id)},
        {"$set": updates},
        return_document=pymongo.ReturnDocument.AFTER,
        projection={"_id": 0}
    )
    return doc

async def render_template(template_identifier: str, values: dict | None = None) -> str:
    templates = await load_appointment_templates()
    settings = await load_settings()
    data = {**settings, **(values or {})}
    
    template = ""
    # Try exact key match first
    if template_identifier in templates:
        template = templates[template_identifier].get("message", "")
    else:
        # Fallback to searching by template_name
        for tmpl in templates.values():
            if tmpl.get("template_name") == template_identifier:
                template = tmpl.get("message", "")
                break
                
    try:
        return template.format(**data)
    except KeyError:
        return template

BACKUP_COLLECTIONS = {
    "patients": patients_collection,
    "scheduled_appointments": scheduled_appointments_collection,
    "past_appointments": past_appointments_collection,
    "appointment_requests": appointment_requests_collection,
    "portal_settings": portal_settings_collection,
    "appointment_message_templates": appointment_message_templates_collection,
    "pregnancy_templates": pregnancy_templates_collection,
    "conditions_config": conditions_config_collection,
    "medical_history_config": medical_history_config_collection,
}

FILENAME_TO_COLLECTION = {
    "patients.json": "patients",
    "patients_data.json": "patients",
    "scheduled_appointments.json": "scheduled_appointments",
    "past_appointments.json": "past_appointments",
    "appointment_requests.json": "appointment_requests",
    "portal_settings.json": "portal_settings",
    "appointment_message_templates.json": "appointment_message_templates",
    "pregnancy_templates.json": "pregnancy_templates",
    "templates_data.json": "pregnancy_templates",
    "conditions_config.json": "conditions_config",
    "medical_history_config.json": "medical_history_config",
}


async def create_backup_zip() -> str:
    tmp_dir = tempfile.mkdtemp()
    name = f"maternal_portal_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    zip_path = os.path.join(tmp_dir, name)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for col_name, collection in BACKUP_COLLECTIONS.items():
            docs = await collection.find({}, {"_id": 0}).to_list(length=None)
            json_str = json.dumps(docs, default=str, indent=2)
            zf.writestr(f"{col_name}.json", json_str)
    return zip_path


async def import_backup_zip(zip_path: str) -> list:
    imported = []
    tmp_dir = tempfile.mkdtemp()
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(tmp_dir)
        for member in zf.namelist():
            filename = os.path.basename(member)
            col_name = FILENAME_TO_COLLECTION.get(filename)
            if not col_name:
                continue
            collection = BACKUP_COLLECTIONS[col_name]
            file_path = os.path.join(tmp_dir, member)
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, list):
                data = [data]
            await collection.delete_many({})
            if data:
                await collection.insert_many(data)
            imported.append(col_name)
    return imported
