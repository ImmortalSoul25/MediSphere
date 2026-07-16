from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from database import calendar_events_collection
from models import CalendarEvent
from datetime import datetime

router = APIRouter(prefix="/calendar-api", tags=["Calendar"])

@router.get("")
@router.get("/")
async def get_events(
    start: Optional[str] = None, 
    end: Optional[str] = None, 
    type: Optional[str] = None
):
    query = {"status": "Active"}
    
    if type:
        query["type"] = type
        
    # Optional date filtering
    if start or end:
        date_query = {}
        if start:
            date_query["$gte"] = start
        if end:
            date_query["$lte"] = end
        query["startDate"] = date_query
        
    cursor = calendar_events_collection.find(query)
    events = await cursor.to_list(length=None)
    
    # Map _id to id for the frontend
    for event in events:
        event["id"] = event.pop("_id", None)
        
    return events

@router.get("/{id}")
async def get_event(id: str):
    event = await calendar_events_collection.find_one({"_id": id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event["id"] = event.pop("_id", None)
    return event

@router.post("")
@router.post("/")
async def create_event(event: dict):
    new_event = CalendarEvent(**event)
    doc = new_event.model_dump(by_alias=True)
    await calendar_events_collection.insert_one(doc)
    doc["id"] = doc.pop("_id", None)
    return doc

@router.put("/{id}")
async def update_event(id: str, event: dict):
    event["updatedAt"] = datetime.now().isoformat()
    # Ensure _id is not accidentally overwritten with something else
    if "id" in event:
        del event["id"]
    if "_id" in event:
        del event["_id"]
        
    result = await calendar_events_collection.update_one(
        {"_id": id}, 
        {"$set": event}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated_event = await calendar_events_collection.find_one({"_id": id})
    updated_event["id"] = updated_event.pop("_id", None)
    return updated_event

@router.delete("/{id}")
async def delete_event(id: str):
    result = await calendar_events_collection.delete_one({"_id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Deleted successfully"}
