import asyncio
from database import appointment_requests_collection
async def run():
    docs = await appointment_requests_collection.find({}, {'_id': 0}).to_list(None)
    for d in docs[-3:]:
        print(d)
asyncio.run(run())
