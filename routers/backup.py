from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
import os
import shutil
import tempfile
from services.backup_service import export_full_backup, export_patients_excel
from portal_settings import import_backup_zip

router = APIRouter(prefix="/backup", tags=["backup"])

@router.get("/export/full")
async def export_full_backup_route():
    zip_path = await export_full_backup()
    filename = os.path.basename(zip_path)
    return FileResponse(zip_path, media_type="application/zip", filename=filename)

@router.get("/export/excel")
async def export_excel():
    excel_path = await export_patients_excel()
    filename = os.path.basename(excel_path)
    return FileResponse(excel_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=filename)

@router.post("/import/full")
async def import_full_backup_route(file: UploadFile = File(...)):
    tmp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(tmp_dir, "uploaded_backup.zip")
    with open(zip_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    imported = await import_backup_zip(zip_path)
    return {"message": "Database restored successfully", "imported": imported}
