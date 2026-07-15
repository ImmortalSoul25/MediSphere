from fastapi import APIRouter, Request, HTTPException
from database import portal_settings_collection, conditions_config_collection, medical_history_config_collection
from portal_settings import load_settings, save_settings

router = APIRouter(tags=["Settings"])

@router.get("/portal-settings")
async def get_portal_settings():
    return await load_settings()

@router.patch("/portal-settings")
async def update_portal_settings(req: Request):
    payload = await req.json()
    return await save_settings(payload)

@router.get("/config/conditions")
async def get_conditions():
    docs = await conditions_config_collection.find({}, {"_id": 0}).to_list(length=None)
    return docs

@router.get("/config/medical-history")
async def get_medical_history():
    docs = await medical_history_config_collection.find({}, {"_id": 0}).to_list(length=None)
    return docs

import uuid

@router.post("/config/conditions")
async def add_condition(req: Request):
    payload = await req.json()
    new_doc = {
        "id": str(uuid.uuid4())[:8].upper(),
        "name": payload.get("name", "").strip()
    }
    if not new_doc["name"]:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    await conditions_config_collection.insert_one(new_doc)
    new_doc.pop("_id", None)
    return new_doc

@router.delete("/config/conditions/{condition_id}")
async def delete_condition(condition_id: str):
    res = await conditions_config_collection.delete_one({"id": condition_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@router.post("/config/medical-history")
async def add_medical_history(req: Request):
    payload = await req.json()
    new_doc = {
        "id": str(uuid.uuid4())[:8].upper(),
        "name": payload.get("name", "").strip()
    }
    if not new_doc["name"]:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    await medical_history_config_collection.insert_one(new_doc)
    new_doc.pop("_id", None)
    return new_doc

@router.delete("/config/medical-history/{history_id}")
async def delete_medical_history(history_id: str):
    res = await medical_history_config_collection.delete_one({"id": history_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
