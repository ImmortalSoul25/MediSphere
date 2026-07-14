from fastapi import APIRouter, Request, HTTPException
from portal_settings import load_appointment_templates, update_appointment_template

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("/appointments")
async def get_appointment_templates():
    return await load_appointment_templates()

@router.patch("/appointments/{template_id}")
async def update_appt_template(template_id: str, req: Request):
    payload = await req.json()
    res = await update_appointment_template(template_id, payload)
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return res

from database import pregnancy_templates_collection
import pymongo

@router.get("/pregnancy")
async def get_pregnancy_templates():
    cursor = pregnancy_templates_collection.find({}, {"_id": 0})
    docs = await cursor.to_list(length=1000)
    
    # Return as an array instead of dict to match what frontend might expect
    # Wait, the frontend might expect an array. Let's check TemplatesContext.
    # The frontend does: setPregnancy(pregData); where pregData is what is returned.
    # And map expects it to be an array: (prev || []).map((t) => String(t.week) ...
    # So we should return an array.
    if not docs:
        # Load from fallback or just return empty
        # We can implement a fallback generator or just return empty for now
        pass
    
    def parse_week(x):
        w = x.get("week", 0)
        try:
            return int(w)
        except (ValueError, TypeError):
            return 999 if w == "stop_msg" else 1000

    docs.sort(key=parse_week)
    return docs

@router.patch("/pregnancy/{week}")
async def update_pregnancy_template(week: str, req: Request):
    payload = await req.json()
    try:
        week_val = int(week)
    except ValueError:
        week_val = week
        
    doc = await pregnancy_templates_collection.find_one_and_update(
        {"week": week_val},
        {"$set": payload},
        return_document=pymongo.ReturnDocument.AFTER,
        projection={"_id": 0}
    )
    if not doc:
        # If it doesn't exist, we can upsert it
        doc = await pregnancy_templates_collection.find_one_and_update(
            {"week": int(week)},
            {"$set": {**payload, "week": int(week)}},
            upsert=True,
            return_document=pymongo.ReturnDocument.AFTER,
            projection={"_id": 0}
        )
    return {"ok": True, "template": doc}
