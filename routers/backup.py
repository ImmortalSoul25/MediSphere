from fastapi import APIRouter
from fastapi.responses import FileResponse
import os
from services.backup_service import export_full_backup, export_patients_excel

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
