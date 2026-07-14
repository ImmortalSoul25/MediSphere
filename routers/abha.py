from fastapi import APIRouter, Request
router = APIRouter(prefix="/patients", tags=["ABHA"])

@router.post("/{patient_id}/abha/verify")
async def abha_verify(patient_id: str, req: Request):
    payload = await req.json()
    return {"status": "Verified", "abhaId": payload.get("abhaId")}

@router.post("/{patient_id}/abha/request-consent")
async def abha_request_consent(patient_id: str):
    return {"status": "Consent Requested"}

@router.get("/{patient_id}/abha/status")
async def abha_status(patient_id: str):
    return {"status": "Verified"}

@router.post("/{patient_id}/abha/sync")
async def abha_sync(patient_id: str):
    return {"status": "Synced", "timestamp": "2023-01-01T12:00:00Z"}

@router.delete("/{patient_id}/abha/unlink")
async def abha_unlink(patient_id: str):
    return {"status": "Unlinked"}

@router.get("/{patient_id}/abha/profile")
async def abha_profile(patient_id: str):
    return {"abhaId": "12-3456-7890-1234", "name": "Test User"}

@router.get("/{patient_id}/abha/imported-records")
async def abha_imported_records(patient_id: str):
    return []
