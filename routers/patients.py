from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Response
from fastapi.responses import JSONResponse
from profile_photo_service import save_photo, get_photo_bytes, delete_photo
from database import patients_collection
from models import PatientMetaData, Patient

router = APIRouter(prefix="/patient", tags=["Patients"])

@router.get("/generate-id")
async def generate_id():
    import random
    while True:
        new_id = str(random.randint(100000, 999999))
        existing = await patients_collection.find_one({"id": new_id})
        if not existing:
            return {"id": new_id}

@router.get("/search")
async def search_patients(q: str = ""):
    if not q or len(q.strip()) < 1:
        return []
    q_str = q.strip()
    
    query = {
        "$or": [
            {"metadata.id": {"$regex": q_str, "$options": "i"}},
            {"metadata.name": {"$regex": q_str, "$options": "i"}},
            {"metadata.contact": {"$regex": q_str, "$options": "i"}}
        ]
    }
    
    cursor = patients_collection.find(query, {"_id": 0}).limit(5)
    results = await cursor.to_list(length=5)
    return results

@router.post("/add/md", status_code=201)
async def add_patient_metadata(req: Request):
    payload = await req.json()
    try:
        md = PatientMetaData(**payload)
        patient = Patient(metadata=md)
        doc = patient.model_dump(by_alias=True)
        await patients_collection.insert_one(doc)
        doc.pop("_id", None)
        return {"message": "Patient created successfully", "patient": doc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/add/det", status_code=201)
async def add_patient_details(req: Request):
    payload = await req.json()
    try:
        patient = Patient(**payload)
        doc = patient.model_dump(by_alias=True)
        await patients_collection.insert_one(doc)
        doc.pop("_id", None)
        return {"message": "Patient (with details) created successfully", "patient": doc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/remove/{patient_id}")
async def remove_patient(patient_id: str):
    res = await patients_collection.delete_one({"metadata.id": patient_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": f"Patient {patient_id} deleted."}

@router.patch("/edit/md/{patient_id}")
async def edit_patient_metadata(patient_id: str, req: Request):
    payload = await req.json()
    existing = await patients_collection.find_one({"metadata.id": patient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    existing.pop("_id", None)
    pat_obj = Patient(**existing)
    pat_obj.metadata = PatientMetaData(**{**pat_obj.metadata.model_dump(by_alias=True), **payload})
    doc = pat_obj.model_dump(by_alias=True)
    
    await patients_collection.replace_one({"metadata.id": patient_id}, doc)
    return {"message": f"Patient metadata for {patient_id} updated.", "patient": doc}

@router.patch("/edit/det/{patient_id}")
async def edit_patient_details(patient_id: str, req: Request):
    payload = await req.json()
    existing = await patients_collection.find_one({"metadata.id": patient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    existing.pop("_id", None)
    pat_obj = Patient(**{**existing, **payload})
    doc = pat_obj.model_dump(by_alias=True)
    
    await patients_collection.replace_one({"metadata.id": patient_id}, doc)
    return {"message": f"Patient {patient_id} updated.", "patient": doc}

@router.get("/view/md")
async def view_all_metadata():
    cursor = patients_collection.find({}, {"_id": 0, "metadata": 1})
    docs = await cursor.to_list(length=None)
    return [d.get("metadata") for d in docs]

@router.get("/view/md/{patient_id}")
async def view_metadata(patient_id: str):
    doc = await patients_collection.find_one({"metadata.id": patient_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return doc.get("metadata")

@router.get("/view/det/{patient_id}")
async def view_patient_details(patient_id: str):
    doc = await patients_collection.find_one({"metadata.id": patient_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return doc

@router.get("/{patient_id}/photo")
async def get_patient_photo(patient_id: str):
    photo_bytes = await get_photo_bytes(patient_id)
    return Response(content=photo_bytes, media_type="image/jpeg")

@router.post("/{patient_id}/photo")
async def upload_patient_photo(patient_id: str, file: UploadFile = File(...)):
    contents = await file.read()
    await save_photo(patient_id, contents)
    return {"message": "Photo uploaded successfully", "path": f"/patient/{patient_id}/photo"}

@router.delete("/{patient_id}/photo")
async def remove_patient_photo(patient_id: str):
    deleted = await delete_photo(patient_id)
    if deleted:
        return {"message": "Photo deleted"}
    return {"message": "No photo found"}
