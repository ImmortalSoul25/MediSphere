import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('atlas-credentials.env')
async def main():
    db = AsyncIOMotorClient(os.getenv('MONGODB_URI'))['maternal_portal']
    doc = await db.patients.find_one({})
    print(doc)

asyncio.run(main())
