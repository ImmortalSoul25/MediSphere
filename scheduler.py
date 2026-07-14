import asyncio
from datetime import datetime
from database import queue_collection

async def clear_old_queue_entries():
    """
    Scans the queue collection.
    Removes entries that were not added today.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Delete where addedAt doesn't start with today_str
    try:
        res = await queue_collection.delete_many({"addedAt": {"$not": {"$regex": f"^{today_str}"}}})
        if res.deleted_count > 0:
            print(f"Cleared {res.deleted_count} old entries from the queue.")
    except Exception as e:
        print(f"Failed to clear old queue entries: {e}")

async def run_scheduler():
    """
    Background task loop that runs every 1 hour.
    """
    while True:
        try:
            await clear_old_queue_entries()
        except Exception as e:
            print(f"Error in background scheduler: {e}")
        
        # Sleep for 1 hour (3600 seconds)
        await asyncio.sleep(3600)
