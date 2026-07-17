from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import initialize_db
import asyncio
from scheduler import run_scheduler
from contextlib import asynccontextmanager

from routers import patients, appointments, whatsapp, abha, settings, templates, backup, queue, field_options, calendar, auth
from fastapi import Depends

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_db()
    scheduler_task = asyncio.create_task(run_scheduler())
    yield
    # Shutdown
    scheduler_task.cancel()

app = FastAPI(title="Maternal Portal API", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://medi-sphere-lenest.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

secure_deps = [Depends(auth.get_current_user)]

app.include_router(patients.router, dependencies=secure_deps)
app.include_router(appointments.router, dependencies=secure_deps)
app.include_router(whatsapp.router, dependencies=secure_deps)
app.include_router(abha.router, dependencies=secure_deps)
app.include_router(settings.router, dependencies=secure_deps)
app.include_router(templates.router, dependencies=secure_deps)
app.include_router(backup.router, dependencies=secure_deps)
app.include_router(queue.router, dependencies=secure_deps)
app.include_router(field_options.router, dependencies=secure_deps)
app.include_router(calendar.router, dependencies=secure_deps)
