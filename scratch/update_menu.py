import asyncio
from database import appointment_message_templates_collection

async def main():
    new_msg = (
        "Hello👋\n\n"
        "Welcome to {hospital_name}.\n\n"
        "How can we help you today?"
    )
    res = await appointment_message_templates_collection.update_one(
        {"template_name": "menu"},
        {"$set": {"message": new_msg}}
    )
    print("Modified count:", res.modified_count)

asyncio.run(main())
