import asyncio
from database import whatsapp_logs_collection

async def main():
    logs = await whatsapp_logs_collection.find().sort("_id", -1).to_list(length=15)
    for log in logs:
        print(str(log).encode('ascii', 'backslashreplace').decode('ascii'))

asyncio.run(main())
