import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from jose import JWTError, jwt
import bcrypt
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from pathlib import Path

# Load .env from the same directory as main.py
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

RECEPTIONIST_HASH = os.getenv("RECEPTIONIST_PASSWORD_HASH", "")
DOCTOR_HASH = os.getenv("DOCTOR_PASSWORD_HASH", "")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class LoginRequest(BaseModel):
    role: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("sub")
        if role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return role

@router.post("/login", response_model=Token)
async def login(req: LoginRequest):
    # Fetch hashes inside the function in case they weren't loaded at module level
    rec_hash = os.getenv("RECEPTIONIST_PASSWORD_HASH", "")
    doc_hash = os.getenv("DOCTOR_PASSWORD_HASH", "")
    print(f"[DEBUG] Login Request - Role: {req.role}, Password: {req.password}")
    print(f"[DEBUG] Loaded REC_HASH: {rec_hash}")
    
    if req.role == "receptionist":
        if not verify_password(req.password, rec_hash):
            print("[DEBUG] Verification failed for receptionist")
            raise HTTPException(status_code=401, detail="Incorrect password")
    elif req.role == "doctor":
        if not verify_password(req.password, doc_hash):
            raise HTTPException(status_code=401, detail="Incorrect password")
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": req.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": req.role}
