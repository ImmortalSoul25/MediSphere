from fastapi import APIRouter, HTTPException, Request
from database import field_options_collection

router = APIRouter(prefix="/field-options", tags=["Field Options"])

# Default options per user requirements
DEFAULT_OPTIONS = {
    "marital_status": ["Married", "Unmarried", "Divorced", "Other"],
    "education": ["No Formal Education", "Primary School", "10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Masters", "PhD", "Other"],
    "profession": ["Student", "Homemaker", "Business", "Service", "Doctor", "Engineer", "Teacher", "Government Employee", "Self Employed", "Farmer", "Labourer", "Retired", "Other"],
    "referred_by": ["Website", "YouTube", "Instagram", "Facebook", "Word of Mouth", "Doctor Referral", "Advertisement", "Other"],
    "locality": ["Andheri East", "Andheri West", "Bandra East", "Bandra West", "Borivali East", "Borivali West", "Kandivali East", "Kandivali West", "Malad East", "Malad West", "Goregaon East", "Goregaon West", "Jogeshwari East", "Jogeshwari West", "Vile Parle East", "Vile Parle West", "Santacruz East", "Santacruz West", "Khar West", "Kurla East", "Kurla West", "Chembur", "Ghatkopar East", "Ghatkopar West", "Powai", "Chandivali", "Saki Naka", "Marol", "Versova", "Lokhandwala", "Oshiwara", "Mira Road East", "Mira Road West", "Bhayandar East", "Bhayandar West", "Dahisar East", "Dahisar West", "Mulund East", "Mulund West", "Bhandup East", "Bhandup West", "Nahur", "Vikhroli East", "Vikhroli West", "Kanjurmarg East", "Kanjurmarg West", "Tilak Nagar", "Govandi", "Mankhurd", "Deonar", "Wadala", "Antop Hill", "Sion", "Matunga", "Dadar East", "Dadar West", "Mahim", "Prabhadevi", "Lower Parel", "Parel", "Worli", "Byculla", "Mazgaon", "Sewri", "Colaba", "Cuffe Parade", "Churchgate", "Marine Lines", "Charni Road", "Girgaon", "Grant Road", "Tardeo", "Mumbai Central", "Nagpada", "Dongri", "Kalbadevi", "Bhuleshwar", "Fort", "CST", "Cumballa Hill", "Breach Candy", "Malabar Hill", "Walkeshwar", "Opera House", "Mahalaxmi", "Agripada", "Cotton Green", "Reay Road", "Dockyard Road", "Chinchpokli", "Lalbaug", "King's Circle", "Dharavi", "Kurar", "Aarey Colony", "IC Colony", "Charkop", "Eksar", "Kopar Khairane", "Ghansoli", "Rabale", "Airoli"],
    "city": ["Mumbai", "Thane", "Navi Mumbai", "Panvel", "Kalyan"]
}

@router.on_event("startup")
async def seed_default_options():
    for field, options in DEFAULT_OPTIONS.items():
        doc = await field_options_collection.find_one({"field": field})
        if not doc:
            await field_options_collection.insert_one({"field": field, "options": options})

@router.get("/{field}")
async def get_field_options(field: str):
    doc = await field_options_collection.find_one({"field": field}, {"_id": 0})
    if not doc:
        # Fallback to default if not seeded yet
        return DEFAULT_OPTIONS.get(field, [])
    return doc.get("options", [])

@router.post("/{field}")
async def add_field_option(field: str, req: Request):
    payload = await req.json()
    new_option = payload.get("option")
    if not new_option or not isinstance(new_option, str):
        raise HTTPException(status_code=400, detail="Option must be a string")
    
    new_option = new_option.strip()
    if not new_option:
        raise HTTPException(status_code=400, detail="Option cannot be empty")
        
    doc = await field_options_collection.find_one({"field": field})
    if not doc:
        # Create new document with default + new option
        options = DEFAULT_OPTIONS.get(field, [])
        if new_option not in options:
            options.append(new_option)
        await field_options_collection.insert_one({"field": field, "options": options})
    else:
        options = doc.get("options", [])
        if new_option not in options:
            await field_options_collection.update_one(
                {"field": field},
                {"$push": {"options": new_option}}
            )
            
    return {"message": f"Option '{new_option}' added to {field}", "option": new_option}
