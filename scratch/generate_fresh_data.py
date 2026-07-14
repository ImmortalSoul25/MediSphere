import asyncio
import random
import uuid
import datetime
import os
import shutil

from database import (
    patients_collection,
    past_appointments_collection,
    scheduled_appointments_collection,
    appointment_requests_collection,
    conditions_config_collection,
    medical_history_config_collection,
    initialize_db
)
from models import Patient, PatientMetaData, ScheduledAppointment, AppointmentRequest

MALE_NAMES = ["Amit Kumar", "Ravi Verma", "Suresh Sharma", "Rahul Singh", "Vikram Das", "Rajesh Patel", "Manoj Gupta", "Deepak Chawla", "Sanjay Reddy", "Vivek Joshi", "Anil Kapoor", "Sunil Shetty"]
FEMALE_NAMES = ["Priya Sharma", "Anita Desai", "Sunita Rao", "Kavita Singh", "Sneha Patel", "Roshni Gupta", "Pooja Verma", "Nisha Reddy", "Radhika Das", "Anjali Joshi", "Meera Kumar", "Geeta Chawla", "Aarti Shetty", "Ritu Kapoor", "Neha Agarwal"]

CONDITIONS = ["PCOS", "Hypertension", "Diabetes", "Anemia", "Thyroid", "Normal"]
MEDICAL_HISTORY_OPTIONS = ["Asthma", "Thyroid Disorder", "High Blood Pressure", "Diabetes Type 2", "Previous C-Section"]

def generate_random_phone():
    return "9" + "".join([str(random.randint(0, 9)) for _ in range(9)])

def get_random_dob(min_age, max_age):
    now = datetime.datetime.now()
    age = random.randint(min_age, max_age)
    year = now.year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"

def calculate_age(dob_str):
    if not dob_str: return ""
    y, m, d = map(int, dob_str.split("-"))
    now = datetime.datetime.now()
    age = now.year - y - ((now.month, now.day) < (m, d))
    return str(age)

async def main():
    print("Clearing profile photos...")
    photo_dir = "profile_photos"
    if os.path.exists(photo_dir):
        shutil.rmtree(photo_dir)
    os.makedirs(photo_dir, exist_ok=True)

    print("Dropping collections...")
    await patients_collection.drop()
    await past_appointments_collection.drop()
    await scheduled_appointments_collection.drop()
    await appointment_requests_collection.drop()
    
    print("Re-initializing DB indexes...")
    await initialize_db()

    # Load real configs if possible
    cond_docs = await conditions_config_collection.find({}, {"_id": 0}).to_list(length=None)
    med_docs = await medical_history_config_collection.find({}, {"_id": 0}).to_list(length=None)
    
    # We'll map conditions based on gender
    female_conds = [c["code"] for c in cond_docs if c.get("gender") in ["Female", "Both"]] if cond_docs else CONDITIONS
    male_conds = [c["code"] for c in cond_docs if c.get("gender") in ["Male", "Both"]] if cond_docs else CONDITIONS
    other_conds = [c["code"] for c in cond_docs] if cond_docs else CONDITIONS

    med_list = [m.get("name") or m.get("text") or str(m["id"]) for m in med_docs] if med_docs else MEDICAL_HISTORY_OPTIONS

    pregnancy_cond = next((c["code"] for c in cond_docs if c.get("name") == "Pregnancy" or c.get("code") == "Pregnancy"), "Pregnancy") if cond_docs else "Pregnancy"
    
    # 50 patients: 10 males, 35 females, 5 other
    genders = ["Male"] * 10 + ["Female"] * 35 + ["Other"] * 5
    # Shuffle names to ensure variety
    patients = []
    
    now = datetime.datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    
    # Pre-select 15 females to get pregnancy
    female_indices = [i for i, g in enumerate(genders) if g == "Female"]
    preg_indices = set(random.sample(female_indices, 15))

    print("Generating 50 patients...")
    for i in range(50):
        gender = genders[i]
        name = random.choice(MALE_NAMES) if gender == "Male" else random.choice(FEMALE_NAMES)
        
        # 15 inactive (last visit > 1 yr), 35 active (last visit < 6 mos)
        is_active = i >= 15
        if not is_active:
            days_ago = random.randint(365 + 30, 365 + 200)
        else:
            days_ago = random.randint(1, 150)
            
        last_visit_date = (now - datetime.timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        dob = get_random_dob(25, 60)
        
        cond_list = male_conds if gender == "Male" else (female_conds if gender == "Female" else other_conds)
        cond = pregnancy_cond if (i in preg_indices and gender == "Female") else random.choice(cond_list if cond_list else ["Normal"])
        
        expected_due_date = ""
        if cond == pregnancy_cond and is_active and gender == "Female":
            edd_date = now + datetime.timedelta(days=random.randint(30, 180))
            expected_due_date = edd_date.strftime("%Y-%m-%d")
        # Random history
        num_hist = random.randint(0, 2)
        history = random.sample(med_list, num_hist) if num_hist > 0 else []
        
        patient_id = str(random.randint(100000, 999999))
        contact = generate_random_phone()
        altContact = generate_random_phone() if i < 20 else ""

        md = PatientMetaData(
            id=patient_id,
            name=name,
            contact=contact,
            altContact=altContact,
            date_of_birth=dob,
            gender=gender,
            is_active=is_active,
            receive_msgs=True,
            expected_due_date=expected_due_date,
            last_visit=last_visit_date,
            conditions=[cond],
            medical_history=history,
            abhaId="",
            abhaStatus="Not Linked",
            abhaLinked=False
        )
        
        pat = Patient(
            metadata=md,
            notes=f"Patient presents with {cond}. Requires standard monitoring.",
            visits=[]
        )
        patients.append(pat)
        await patients_collection.insert_one(pat.model_dump())
        
        # 3 Past Appointments
        for a_idx in range(3):
            # First one is older, last one is last_visit_date
            appt_days_ago = days_ago + (2 - a_idx) * 30
            appt_date = (now - datetime.timedelta(days=appt_days_ago))
            appt_type = "First Consultation" if a_idx == 0 else "Follow Up"
            
            p_appt = {
                "id": str(uuid.uuid4())[:8].upper(),
                "patientId": patient_id,
                "patientName": name,
                "contact": contact,
                "age": calculate_age(dob),
                "appointmentDate": appt_date.strftime("%Y-%m-%d"),
                "appointmentTime": f"{random.randint(9, 11)}:00 AM",
                "appointmentType": appt_type,
                "appointment_day": appt_date.strftime("%A"),
                "appointmentNotes": f"Notes for {appt_type}. Patient condition: {cond}.",
                "reminder_sent": True
            }
            await past_appointments_collection.insert_one(p_appt)

    # Scheduled Appointments (20 out of 35 active)
    print("Generating scheduled appointments...")
    active_pats = patients[15:]
    scheduled_pats = random.sample(active_pats, 20)
    
    # 5 today, 8 tomorrow, 7 other within 7 days
    offsets = [0]*5 + [1]*8 + [random.randint(2, 6) for _ in range(7)]
    types = ["Routine Check", "Follow Up", "Surgery"]
    for idx, pat in enumerate(scheduled_pats):
        offset = offsets[idx]
        s_date = now + datetime.timedelta(days=offset)
        appt_type = random.choice(types)
        
        notes = "Regular check up"
        if appt_type == "Surgery":
            notes = f"Scheduled surgery for {pat.metadata.conditions[0] if pat.metadata.conditions else 'procedure'}"
        elif appt_type == "Follow Up":
            notes = "Follow up on recent medication"
            
        s_appt = ScheduledAppointment(
            id=str(uuid.uuid4())[:8].upper(),
            patientId=pat.metadata.id,
            patientName=pat.metadata.name,
            contact=pat.metadata.contact,
            age=calculate_age(pat.metadata.date_of_birth),
            appointmentDate=s_date.strftime("%Y-%m-%d"),
            appointment_day=s_date.strftime("%A"),
            appointmentTime=f"{random.randint(2, 5)}:00 PM",
            appointmentType=appt_type,
            notes=notes,
            status="Scheduled",
            createdAt=now.isoformat()
        )
        await scheduled_appointments_collection.insert_one(s_appt.model_dump(by_alias=True))
        
    # Pending Requests
    print("Generating pending requests...")
    # 7 existing
    req_existing = random.sample(patients, 7)
    concerns = ["Feeling weak", "Need routine checkup", "Experiencing pain", "Follow up request", "Fever and chills", "Medication refill"]
    for pat in req_existing:
        req_date = now + datetime.timedelta(days=random.randint(1, 5))
        req = AppointmentRequest(
            id=str(uuid.uuid4())[:8].upper(),
            patientName=pat.metadata.name,
            patientId=pat.metadata.id,
            contact=pat.metadata.contact,
            age=calculate_age(pat.metadata.date_of_birth),
            preferredDate=req_date.strftime("%Y-%m-%d"),
            preferredTime="Morning",
            concern=random.choice(concerns),
            status="Pending",
            createdAt=now.isoformat()
        )
        await appointment_requests_collection.insert_one(req.model_dump(by_alias=True))
        
    # 8 new
    for i in range(8):
        req_date = now + datetime.timedelta(days=random.randint(1, 5))
        req = AppointmentRequest(
            id=str(uuid.uuid4())[:8].upper(),
            patientName=random.choice(FEMALE_NAMES),
            patientId="",
            contact=generate_random_phone(),
            age=str(random.randint(25, 35)),
            preferredDate=req_date.strftime("%Y-%m-%d"),
            preferredTime="Evening",
            concern=random.choice(concerns),
            status="Pending",
            createdAt=now.isoformat()
        )
        await appointment_requests_collection.insert_one(req.model_dump(by_alias=True))
        
    print("Done generating fresh data!")

if __name__ == "__main__":
    asyncio.run(main())
