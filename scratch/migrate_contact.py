import asyncio
from database import patients_collection

async def migrate_contact():
    docs = await patients_collection.find().to_list(length=None)
    for doc in docs:
        if "metadata" in doc:
            meta = doc["metadata"]
            needs_update = False
            if "number" in meta:
                meta["contact"] = meta.pop("number")
                needs_update = True
            if "alt_number" in meta:
                meta["altContact"] = meta.pop("alt_number")
                needs_update = True
            
            if needs_update:
                await patients_collection.update_one({"_id": doc["_id"]}, {"$set": {"metadata": meta}})
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_contact())
