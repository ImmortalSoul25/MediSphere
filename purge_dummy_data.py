import asyncio
import os
import sys

# Ensure the root directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import (
    patients_collection,
    scheduled_appointments_collection,
    past_appointments_collection,
    appointment_requests_collection,
    calendar_events_collection,
    queue_collection,
    abha_records_collection,
    abha_sync_logs_collection,
    abha_consents_collection,
    profile_photos_collection,
    portal_settings_collection,
    appointment_message_templates_collection,
    conditions_config_collection,
    medical_history_config_collection,
    field_options_collection,
    whatsapp_logs_collection
)

async def main():
    print("Purging dummy data...")
    collections_to_purge = [
        ("Patients", patients_collection),
        ("Scheduled Appointments", scheduled_appointments_collection),
        ("Past Appointments", past_appointments_collection),
        ("Appointment Requests", appointment_requests_collection),
        ("Calendar Events", calendar_events_collection),
        ("Queue", queue_collection),
        ("ABHA Records", abha_records_collection),
        ("ABHA Sync Logs", abha_sync_logs_collection),
        ("ABHA Consents", abha_consents_collection),
        ("Profile Photos", profile_photos_collection),
        ("WhatsApp Logs", whatsapp_logs_collection)
    ]
    
    for name, collection in collections_to_purge:
        result = await collection.delete_many({})
        print(f"Deleted {result.deleted_count} documents from {name}")
        
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
