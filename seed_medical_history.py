import asyncio
import os
import sys
import uuid

# Ensure the root directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import medical_history_config_collection

async def main():
    print("Seeding medical history config...")
    
    # Check if empty
    count = await medical_history_config_collection.count_documents({})
    if count == 0:
        default_medical_history = [
            "Diabetes",
            "Hypertension",
            "Thyroid",
            "Asthma",
            "Epilepsy",
            "Heart Disease",
            "Allergies",
            "Previous Surgeries",
            "None"
        ]
        
        docs = []
        for mh in default_medical_history:
            docs.append({
                "id": str(uuid.uuid4())[:8].upper(),
                "name": mh
            })
            
        await medical_history_config_collection.insert_many(docs)
        print(f"Inserted {len(docs)} default medical history options.")
    else:
        print(f"Medical history already has {count} options. Skipping.")
        
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
