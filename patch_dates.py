import asyncio
from database import calendar_events_collection
async def run():
    docs = await calendar_events_collection.find({}).to_list(100)
    for d in docs:
        if d.get('allDay') or d.get('type') in ['Birthday', 'Pregnancy Due Date']:
            if d.get('endDate') != d.get('startDate'):
                await calendar_events_collection.update_one({'_id': d['_id']}, {'$set': {'endDate': d['startDate'], 'allDay': True}})
                print(f"Updated {d['title']} endDate to {d['startDate']}")
if __name__ == '__main__':
    asyncio.run(run())
