import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
env_path = os.path.join(BASE_DIR, "atlas-credentials.env")
load_dotenv(env_path)

MONGODB_URI = os.getenv("MONGODB_URI")

DEFAULT_OPTIONS = {
    "marital_status": ["Married", "Unmarried", "Divorced", "Other"],
    "education": ["No Formal Education", "Primary School", "10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Masters", "PhD", "Other"],
    "profession": ["Student", "Homemaker", "Business", "Service", "Doctor", "Engineer", "Teacher", "Government Employee", "Self Employed", "Farmer", "Labourer", "Retired", "Other"],
    "referred_by": ["Website", "YouTube", "Instagram", "Facebook", "Word of Mouth", "Doctor Referral", "Advertisement", "Other"],
    "locality": ["Andheri East", "Andheri West", "Bandra East", "Bandra West", "Borivali East", "Borivali West", "Kandivali East", "Kandivali West", "Malad East", "Malad West", "Goregaon East", "Goregaon West", "Jogeshwari East", "Jogeshwari West", "Vile Parle East", "Vile Parle West", "Santacruz East", "Santacruz West", "Khar West", "Kurla East", "Kurla West", "Chembur", "Ghatkopar East", "Ghatkopar West", "Powai", "Chandivali", "Saki Naka", "Marol", "Versova", "Lokhandwala", "Oshiwara", "Mira Road East", "Mira Road West", "Bhayandar East", "Bhayandar West", "Dahisar East", "Dahisar West", "Mulund East", "Mulund West", "Bhandup East", "Bhandup West", "Nahur", "Vikhroli East", "Vikhroli West", "Kanjurmarg East", "Kanjurmarg West", "Tilak Nagar", "Govandi", "Mankhurd", "Deonar", "Wadala", "Antop Hill", "Sion", "Matunga", "Dadar East", "Dadar West", "Mahim", "Prabhadevi", "Lower Parel", "Parel", "Worli", "Byculla", "Mazgaon", "Sewri", "Colaba", "Cuffe Parade", "Churchgate", "Marine Lines", "Charni Road", "Girgaon", "Grant Road", "Tardeo", "Mumbai Central", "Nagpada", "Dongri", "Kalbadevi", "Bhuleshwar", "Fort", "CST", "Cumballa Hill", "Breach Candy", "Malabar Hill", "Walkeshwar", "Opera House", "Mahalaxmi", "Agripada", "Cotton Green", "Reay Road", "Dockyard Road", "Chinchpokli", "Lalbaug", "King's Circle", "Dharavi", "Kurar", "Aarey Colony", "IC Colony", "Charkop", "Eksar", "Kopar Khairane", "Ghansoli", "Rabale", "Airoli"],
    "city": ["Mumbai", "Thane", "Navi Mumbai", "Panvel", "Kalyan"]
}

MEDICAL_HISTORY = [
    {"code": "MH01", "name": "Diabetes", "gender": "Both"},
    {"code": "MH02", "name": "Hypertension", "gender": "Both"},
    {"code": "MH03", "name": "Thyroid Disorder", "gender": "Both"},
    {"code": "MH04", "name": "Asthma", "gender": "Both"},
    {"code": "MH05", "name": "Cardiac Issues", "gender": "Both"},
    {"code": "MH06", "name": "Tuberculosis", "gender": "Both"},
    {"code": "MH07", "name": "Epilepsy", "gender": "Both"},
    {"code": "MH08", "name": "Previous C-Section", "gender": "Female"},
]

async def update_db():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client["maternal_portal"]
    
    # 1. Add field options
    field_options = db["field_options"]
    for field, options in DEFAULT_OPTIONS.items():
        doc = await field_options.find_one({"field": field})
        if not doc:
            await field_options.insert_one({"field": field, "options": options})
            print(f"Added field {field}")
        else:
            await field_options.update_one({"field": field}, {"$set": {"options": options}})
            print(f"Updated field {field}")
            
    # 2. Medical History config
    mh_col = db["medical_history_config"]
    count = await mh_col.count_documents({})
    if count == 0:
        await mh_col.insert_many(MEDICAL_HISTORY)
        print("Inserted medical history config")
    else:
        print("Medical history already exists")
        
asyncio.run(update_db())
