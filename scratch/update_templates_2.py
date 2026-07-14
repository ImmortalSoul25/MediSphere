import asyncio
from database import pregnancy_templates_collection

async def update_templates():
    docs = await pregnancy_templates_collection.find().to_list(length=None)
    for doc in docs:
        if doc.get("week") is not None:
            # Append STOP instruction if not present
            msg = doc["message"]
            if "If you want to stop receiving messages" not in msg and "If you want to stop recieving messages" not in msg:
                msg += "\n\nIf you want to stop receiving messages, type STOP."
                await pregnancy_templates_collection.update_one({"_id": doc["_id"]}, {"$set": {"message": msg}})
                
    # Add STOP and START templates
    stop_exists = await pregnancy_templates_collection.find_one({"week": "stop_msg"})
    if not stop_exists:
        await pregnancy_templates_collection.insert_one({
            "week": "stop_msg",
            "message": "Okay messages are stopped. If you want to continue again anytime then type START."
        })
        
    start_exists = await pregnancy_templates_collection.find_one({"week": "start_msg"})
    if not start_exists:
        await pregnancy_templates_collection.insert_one({
            "week": "start_msg",
            "message": "Welcome back! Your pregnancy messages have been resumed. If you want to stop again anytime, type STOP."
        })
    print("Templates updated!")

if __name__ == "__main__":
    asyncio.run(update_templates())
