import asyncio
from database import appointment_requests_collection, patients_collection
async def run():
    requests = await appointment_requests_collection.find({"patientId": ""}).to_list(None)
    for req in requests:
        contact = req.get("contact", "")
        if contact:
            patient = await patients_collection.find_one({"metadata.contact": contact})
            if patient:
                await appointment_requests_collection.update_one(
                    {"_id": req["_id"]},
                    {"$set": {"patientId": patient["metadata"]["id"]}}
                )
asyncio.run(run())
