from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import initialize_db
import asyncio
from scheduler import run_scheduler
from contextlib import asynccontextmanager

from routers import patients, appointments, whatsapp, abha, settings, templates, backup, queue, field_options, calendar

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_db()
    scheduler_task = asyncio.create_task(run_scheduler())
    yield
    # Shutdown
    scheduler_task.cancel()

app = FastAPI(title="Maternal Portal API", lifespan=lifespan)

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

app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(whatsapp.router)
app.include_router(abha.router)
app.include_router(settings.router)
app.include_router(templates.router)
app.include_router(backup.router)
app.include_router(queue.router)
app.include_router(field_options.router)
app.include_router(calendar.router)
