import os
import json
import zipfile
import tempfile
import shutil
import pandas as pd
from datetime import datetime
import asyncio
from database import (
    patients_collection, scheduled_appointments_collection, past_appointments_collection,
    appointment_requests_collection, portal_settings_collection,
    appointment_message_templates_collection, pregnancy_templates_collection,
    conditions_config_collection, medical_history_config_collection,
    abha_records_collection, abha_sync_logs_collection, abha_consents_collection,
    calendar_events_collection
)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROFILE_PHOTOS_DIR = os.path.join(BASE_DIR, "profile_photos")

# Map of JSON filenames to MongoDB collections
BACKUP_COLLECTIONS = {
    "patients.json": patients_collection,
    "scheduled_appointments.json": scheduled_appointments_collection,
    "past_appointments.json": past_appointments_collection,
    "appointment_requests.json": appointment_requests_collection,
    "settings.json": portal_settings_collection,
    "templates.json": appointment_message_templates_collection,
    "pregnancy_templates.json": pregnancy_templates_collection,
    "conditions_config.json": conditions_config_collection,
    "medical_history_config.json": medical_history_config_collection,
    "abha_records.json": abha_records_collection,
    "abha_sync_logs.json": abha_sync_logs_collection,
    "abha_consents.json": abha_consents_collection,
    "calendar_events.json": calendar_events_collection
}

def get_metadata():
    return {
        "application": "MediSync",
        "version": "1.0.0",
        "backupDate": datetime.now().isoformat(),
        "database": "MongoDB Atlas",
        "collections": list(BACKUP_COLLECTIONS.keys())
    }

async def export_full_backup() -> str:
    """Creates a ZIP backup of all MongoDB collections and profile photos."""
    tmp_dir = tempfile.mkdtemp()
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    zip_filename = f"Backup_{timestamp}.zip"
    zip_path = os.path.join(tmp_dir, zip_filename)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # 1. Export Metadata
        metadata = get_metadata()
        zf.writestr("metadata.json", json.dumps(metadata, indent=2))

        # 2. Export MongoDB collections
        for filename, collection in BACKUP_COLLECTIONS.items():
            docs = await collection.find({}, {"_id": 0}).to_list(length=None)
            zf.writestr(filename, json.dumps(docs, default=str, indent=2))

        # 3. Export profile_photos folder
        if os.path.exists(PROFILE_PHOTOS_DIR):
            for root, _, files in os.walk(PROFILE_PHOTOS_DIR):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.join("profile_photos", os.path.relpath(file_path, PROFILE_PHOTOS_DIR))
                    zf.write(file_path, arcname)

    return zip_path

async def export_patients_excel() -> str:
    """Exports all patients to an Excel file."""
    patients = await patients_collection.find({}, {"_id": 0}).to_list(length=None)
    
    # Process patients list into flat dictionaries for pandas
    flat_patients = []
    for p in patients:
        meta = p.get("metadata", {})
        flat_p = {
            "ID": meta.get("id"),
            "Name": meta.get("name"),
            "Gender": meta.get("gender"),
            "Date of Birth": meta.get("date_of_birth", ""),
            "Phone Number": meta.get("number") or meta.get("contact", ""),
            "Active": meta.get("is_active", True),
            "Receive Messages": meta.get("receive_msgs", True),
            "ABHA Address": meta.get("abhaId", ""),
            "ABHA Linked": meta.get("abhaLinked", False),
            "Last Visit": meta.get("last_visit", ""),
            "Follow Up Date": p.get("due_date", ""),
            "Expected Due Date": meta.get("expected_due_date", ""),
            "Marital Status": meta.get("marital_status", ""),
            "Education": meta.get("education", ""),
            "Profession": meta.get("profession", ""),
            "Referred By": meta.get("referred_by", ""),
            "Address Line 1": meta.get("address_line_1", ""),
            "Address Line 2": meta.get("address_line_2", ""),
            "Locality": meta.get("locality", ""),
            "City": meta.get("city", ""),
            "Notes": p.get("notes", "")
        }
        
        # Add conditions and medical history as comma-separated strings
        conditions = meta.get("conditions", [])
        if not isinstance(conditions, list):
            conditions = []
        flat_p["Conditions"] = ", ".join(conditions)
        
        med_hist = meta.get("medical_history", [])
        if not isinstance(med_hist, list):
            med_hist = []
        flat_p["Medical History"] = ", ".join(med_hist)
        
        flat_patients.append(flat_p)
    
    df = pd.DataFrame(flat_patients)
    
    tmp_dir = tempfile.mkdtemp()
    timestamp = datetime.now().strftime("%Y-%m-%d")
    excel_filename = f"Patients_{timestamp}.xlsx"
    excel_path = os.path.join(tmp_dir, excel_filename)
    
    # Write to Excel and auto-adjust columns
    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Patients")
        worksheet = writer.sheets["Patients"]
        
        # Auto-adjust column widths
        for idx, col in enumerate(df.columns):
            max_len = max(
                df[col].map(lambda x: len(str(x))).max() if not df[col].empty else 0,
                len(str(col))
            ) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)
            
            # Make header bold
            cell = worksheet.cell(row=1, column=idx+1)
            cell.font = cell.font.copy(bold=True)
            
    return excel_path

async def _create_rollback_backup() -> str:
    """Creates a temporary in-memory backup of the current database before importing."""
    tmp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(tmp_dir, "rollback.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for filename, collection in BACKUP_COLLECTIONS.items():
            docs = await collection.find({}, {"_id": 0}).to_list(length=None)
            zf.writestr(filename, json.dumps(docs, default=str, indent=2))
            
        if os.path.exists(PROFILE_PHOTOS_DIR):
            for root, _, files in os.walk(PROFILE_PHOTOS_DIR):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.join("profile_photos", os.path.relpath(file_path, PROFILE_PHOTOS_DIR))
                    zf.write(file_path, arcname)
    return zip_path

async def import_full_backup(zip_path: str) -> dict:
    """
    Imports a full backup from a ZIP file.
    Creates a temporary backup, validates the metadata, and restores collections and profile photos.
    Rolls back automatically on failure.
    """
    extract_dir = tempfile.mkdtemp()
    rollback_zip = await _create_rollback_backup()
    
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            for member in zf.namelist():
                if member.startswith("/") or ".." in member:
                    raise Exception("Invalid ZIP: Path traversal attempt")
            zf.extractall(extract_dir)
            
        metadata_path = os.path.join(extract_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            raise Exception("Invalid backup ZIP: metadata.json not found.")
            
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
        if metadata.get("application") != "MediSync":
            raise Exception("Invalid backup: Not a MediSync backup file.")
            
        # Clear collections
        for col in BACKUP_COLLECTIONS.values():
            await col.delete_many({})
            
        # Clear profile photos
        if os.path.exists(PROFILE_PHOTOS_DIR):
            shutil.rmtree(PROFILE_PHOTOS_DIR)
        os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)
        
        # Restore JSON to collections
        available_files = os.listdir(extract_dir)
        restored_collections = 0
        
        for file_name, collection in BACKUP_COLLECTIONS.items():
            if file_name in available_files:
                file_path = os.path.join(extract_dir, file_name)
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    data = [data]
                if data:
                    await collection.insert_many(data)
                restored_collections += 1
                
        # Restore Profile Photos
        extracted_photos_dir = os.path.join(extract_dir, "profile_photos")
        if os.path.exists(extracted_photos_dir):
            for filename in os.listdir(extracted_photos_dir):
                src = os.path.join(extracted_photos_dir, filename)
                dst = os.path.join(PROFILE_PHOTOS_DIR, filename)
                if os.path.isfile(src):
                    shutil.copy2(src, dst)
                    
        return {"status": "success", "message": f"Successfully restored {restored_collections} collections."}
        
    except Exception as e:
        # Perform Rollback
        try:
            with zipfile.ZipFile(rollback_zip, "r") as zf:
                rollback_extract = tempfile.mkdtemp()
                zf.extractall(rollback_extract)
                
                # Restore Collections
                for file_name, collection in BACKUP_COLLECTIONS.items():
                    await collection.delete_many({})
                    file_path = os.path.join(rollback_extract, file_name)
                    if os.path.exists(file_path):
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        if data and isinstance(data, list):
                            await collection.insert_many(data)
                            
                # Restore Photos
                if os.path.exists(PROFILE_PHOTOS_DIR):
                    shutil.rmtree(PROFILE_PHOTOS_DIR)
                os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)
                rollback_photos = os.path.join(rollback_extract, "profile_photos")
                if os.path.exists(rollback_photos):
                    for filename in os.listdir(rollback_photos):
                        src = os.path.join(rollback_photos, filename)
                        dst = os.path.join(PROFILE_PHOTOS_DIR, filename)
                        if os.path.isfile(src):
                            shutil.copy2(src, dst)
        except Exception as rollback_err:
            return {"status": "error", "message": f"Critical error during rollback: {str(rollback_err)}"}
            
        return {"status": "error", "message": f"Import failed, database rolled back to previous state. Error: {str(e)}"}
    finally:
        # Cleanup temp dirs
        try:
            shutil.rmtree(extract_dir)
            shutil.rmtree(os.path.dirname(rollback_zip))
        except Exception:
            pass
