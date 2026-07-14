import asyncio
from database import appointment_requests_collection
async def run():
    # Update any requests where patientId is a phone number (e.g. len > 6 and digits)
    await appointment_requests_collection.update_many(
        {"patientId": {"$regex": r"^\d{7,15}$"}},
        [{"$set": {"contact": "$patientId", "patientId": ""}}]
    )
asyncio.run(run())
