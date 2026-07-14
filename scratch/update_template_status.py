import asyncio
from database import pregnancy_templates_collection, appointment_message_templates_collection

async def update_templates():
    # Update pregnancy templates
    res1 = await pregnancy_templates_collection.update_many(
        {"approval_status": "PENDING"},
        {"$set": {"approval_status": "APPROVED"}}
    )
    print(f"Updated {res1.modified_count} pregnancy templates.")

    # Update appointment templates
    res2 = await appointment_message_templates_collection.update_many(
        {"approval_status": "PENDING"},
        {"$set": {"approval_status": "APPROVED"}}
    )
    print(f"Updated {res2.modified_count} appointment templates.")

if __name__ == "__main__":
    asyncio.run(update_templates())
