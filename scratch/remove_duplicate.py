import asyncio
from database import past_appointments_collection

async def remove_duplicates():
    # Find all docs with the duplicate ID
    cursor = past_appointments_collection.find({"id": "APT-1781855856456"})
    docs = await cursor.to_list(length=None)
    
    if len(docs) > 1:
        print(f"Found {len(docs)} duplicates. Keeping the first one and deleting the rest.")
        # Keep the first one, delete the others by their _id
        for doc in docs[1:]:
            await past_appointments_collection.delete_one({"_id": doc["_id"]})
            print(f"Deleted duplicate with _id: {doc['_id']}")
    else:
        print("No duplicates found for this ID.")

if __name__ == "__main__":
    asyncio.run(remove_duplicates())
