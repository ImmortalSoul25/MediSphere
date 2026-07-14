import asyncio
import pprint
from database import past_appointments_collection, scheduled_appointments_collection

async def main():
    print("Past:")
    docs1 = await past_appointments_collection.find().to_list(1)
    pprint.pprint(docs1)
    print("Scheduled:")
    docs2 = await scheduled_appointments_collection.find().to_list(1)
    pprint.pprint(docs2)

if __name__ == "__main__":
    asyncio.run(main())
