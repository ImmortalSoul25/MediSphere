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
