import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
env_path = os.path.join(BASE_DIR, "atlas-credentials.env")
load_dotenv(env_path)

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "maternal_portal"

client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client[DB_NAME]

patients_collection = db["patients"]
scheduled_appointments_collection = db["scheduled_appointments"]
past_appointments_collection = db["past_appointments"]
appointment_requests_collection = db["appointment_requests"]
portal_settings_collection = db["portal_settings"]
appointment_message_templates_collection = db["appointment_message_templates"]
calendar_events_collection = db["calendar_events"]
pregnancy_templates_collection = db["pregnancy_templates"]
conditions_config_collection = db["conditions_config"]
medical_history_config_collection = db["medical_history_config"]
whatsapp_logs_collection = db["whatsapp_logs"]
queue_collection = db["queue"]
field_options_collection = db["field_options"]
profile_photos_collection = db["profile_photos"]

# ABDM / ABHA Collections
abha_records_collection = db["abha_records"]
abha_sync_logs_collection = db["abha_sync_logs"]
abha_consents_collection = db["abha_consents"]

async def initialize_db():
    try:
        # Create unique indexes
        await patients_collection.create_index("metadata.id", unique=True)
        await scheduled_appointments_collection.create_index("id", unique=True)
        await past_appointments_collection.create_index("id", unique=True)
        await appointment_requests_collection.create_index("requestId", unique=True)
        
        # We can also add indexes to ABHA records
        await abha_records_collection.create_index("patientId", unique=True)
        
        print("MongoDB indexes created successfully.")
    except Exception as e:
        print(f"Error creating indexes: {e}")
