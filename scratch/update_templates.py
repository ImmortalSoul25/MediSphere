import asyncio
from database import database

async def update_templates():
    templates_col = database["pregnancy_message_templates"]
    
    docs = await templates_col.find().to_list(length=None)
    for doc in docs:
        if "type" in doc and doc["type"] == "weekly":
            # Append STOP instruction if not present
            msg = doc["message"]
            if "If you want to stop receiving messages" not in msg and "If you want to stop recieving messages" not in msg:
                msg += "\n\nIf you want to stop receiving messages, type STOP."
                await templates_col.update_one({"_id": doc["_id"]}, {"$set": {"message": msg}})
                
    # Add STOP and START templates
    stop_exists = await templates_col.find_one({"type": "stop_msg"})
    if not stop_exists:
        await templates_col.insert_one({
            "type": "stop_msg",
            "message": "Okay, messages are stopped. If you want to continue again anytime, then type START."
        })
        
    start_exists = await templates_col.find_one({"type": "start_msg"})
    if not start_exists:
        await templates_col.insert_one({
            "type": "start_msg",
            "message": "Welcome back! Your pregnancy messages have been resumed. If you want to stop again anytime, type STOP."
        })
    print("Templates updated!")

if __name__ == "__main__":
    asyncio.run(update_templates())
