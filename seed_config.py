import sys
import os
import asyncio

sys.path.append(r"c:\Krrish\MaternalProject\maternal-portal")
from database import conditions_config_collection, medical_history_config_collection

async def seed_config():
    # Seed Medical History
    mh_count = await medical_history_config_collection.count_documents({})
    if mh_count == 0:
        await medical_history_config_collection.insert_many([
            {"value": "Diabetes", "label": "Diabetes"},
            {"value": "Hypertension", "label": "Hypertension"},
            {"value": "Asthma", "label": "Asthma"},
            {"value": "Thyroid Disorder", "label": "Thyroid Disorder"},
            {"value": "Cardiac Disease", "label": "Cardiac Disease"},
            {"value": "PCOS/PCOD", "label": "PCOS/PCOD"},
            {"value": "None", "label": "None"}
        ])
        print("Seeded Medical History options.")
    else:
        print("Medical History already seeded.")

if __name__ == "__main__":
    asyncio.run(seed_config())
