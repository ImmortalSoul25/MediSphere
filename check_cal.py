import asyncio
from database import calendar_events_collection
async def run():
    docs = await calendar_events_collection.find({}).to_list(10)
    for d in docs:
        print(d)
if __name__ == '__main__':
    asyncio.run(run())
