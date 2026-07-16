from __future__ import annotations
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

# ─────────────────────────────────────────────────────────────────────────────
#  PATIENT MODELS
# ─────────────────────────────────────────────────────────────────────────────

class PatientMetaData(BaseModel):
    id: str
    name: str
    date_of_birth: str = ""
    contact: str
    altContact: str = ""
    gender: str = ""
    is_active: bool = True
    receive_msgs: bool = True
    expected_due_date: str = ""
    last_visit: str = ""
    conditions: List[str] = Field(default_factory=list)
    medical_history: List[str] = Field(default_factory=list)
    abhaId: str = ""
    abhaStatus: str = "Not Linked"
    abhaLinked: bool = False
    abhaLinkedOn: Optional[str] = None
    lastSync: Optional[str] = None
    consentStatus: str = "Not Requested"
    consentRequestedOn: Optional[str] = None
    abhaProfile: Dict[str, Any] = Field(default_factory=dict)
    
    # New Fields
    marital_status: str = ""
    education: str = ""
    profession: str = ""
    referred_by: str = ""
    address_line_1: str = ""
    address_line_2: str = ""
    locality: str = ""
    city: str = ""

class Patient(BaseModel):
    metadata: PatientMetaData
    visits: List[Dict[str, Any]] = Field(default_factory=list)
    due_date: Optional[str] = None
    notes: str = ""

# ─────────────────────────────────────────────────────────────────────────────
#  APPOINTMENT MODELS (CamelCase uniformly to match JS and WhatsApp bot)
# ─────────────────────────────────────────────────────────────────────────────

class AppointmentRequest(BaseModel):
    id: str = Field(alias="requestId", default="")
    patientName: str = ""
    patientId: str = ""
    contact: str = ""
    age: str = ""
    preferredDate: str = ""
    preferredTime: str = ""
    concern: str = ""
    status: str = "Pending"
    createdAt: str = ""

    class Config:
        populate_by_name = True

class ScheduledAppointment(BaseModel):
    id: str
    patientId: str
    patientName: str
    contact: str = ""
    age: str = ""
    appointmentDate: str
    appointment_day: str = ""
    appointmentTime: str
    appointmentType: str = "Consultation"
    notes: str = ""
    status: str = "Scheduled"
    createdAt: str = ""

class PastAppointment(BaseModel):
    id: str = ""
    appointmentId: str
    patientId: str
    patientName: str
    age: str = ""
    appointmentDate: str
    appointmentTime: str
    appointmentType: str = "Consultation"
    notes: str = ""
    status: str = "Completed"
    completedAt: str = ""
    wait_time_minutes: int = 0

# ─────────────────────────────────────────────────────────────────────────────
#  TEMPLATE & CONFIG MODELS
# ─────────────────────────────────────────────────────────────────────────────

class PregnancyTemplate(BaseModel):
    week: Union[int, str]
    message: str = ""
    yt_link: str = ""
    template_name: str = ""
    type: str = "UTILITY"
    approval_status: str = "APPROVED"
    last_updated: str = ""

class AppointmentTemplate(BaseModel):
    id: int
    name: str = ""
    template_name: str = ""
    message: str = ""
    type: str = "UTILITY"
    approval_status: str = "APPROVED"
    last_updated: str = ""

# ─────────────────────────────────────────────────────────────────────────────
#  QUEUE MODEL
# ─────────────────────────────────────────────────────────────────────────────

class QueueEntry(BaseModel):
    id: str
    sr_no: int
    type: str = "Patient" # "Patient", "MR", "Other"
    
    # Common / Patient fields
    patientId: Optional[str] = ""
    name: str = ""
    gender: str = ""
    age: str = ""
    contact: str = ""
    conditions: List[str] = Field(default_factory=list)
    company: Optional[str] = ""
    notes: str = ""
    
    # Meta
    status: str = "Waiting" # "Waiting", "Completed"
    addedAt: str = "" # ISO datetime
    completedAt: Optional[str] = None

class CalendarEvent(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: str
    description: Optional[str] = ""
    startDate: str
    endDate: Optional[str] = ""
    startTime: Optional[str] = ""
    endTime: Optional[str] = ""
    allDay: bool = False
    repeat: str = "None"
    reminder: str = "30 Minutes"
    color: str = ""
    status: str = "Active"
    notes: Optional[str] = ""
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())
