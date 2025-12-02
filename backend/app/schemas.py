from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime



class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    practice_name: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    practice_name: str
    created_at: datetime

    class Config:
        from_attributes = True



class UpcomingAppointmentCSV(BaseModel):
    #bulk upload
    id: int
    age: int
    days_lps: int
    employed: str
    benefits: str
    driver: str    # "Y" or "N" from CSV
    vdu: str
    varifocal: str
    high_rx: str
    appointment_date: str  # parse datetime


class PastAppointmentCSV(BaseModel):

    id: int
    age: int
    days_lps: int
    employed: str
    benefits: str
    driver: str
    vdu: str
    varifocal: str
    high_rx: str
    appointment_date: str
    amount_spent: float


class PatientResponse(BaseModel):

    id: int
    age: int
    days_lps: int
    employed: bool
    benefits: bool
    driver: bool
    vdu: bool
    varifocal: bool
    high_rx: bool
    appointment_date: datetime
    predicted_spend: float
    purchase_probability: float
    created_at: datetime

    class Config:
        from_attributes = True


class WeeklySalesResponse(BaseModel):
    #no longer used
    date: str  # YYYY-MM-DD format
    total_predicted: float


class MonthlySalesResponse(BaseModel):
      #no longer used
    month: str  # YYYY-MM format
    total_predicted: float
    total_actual: float
    variance: float  # actual - predicted


class PastAppointmentResponse(BaseModel):

    id: int
    age: int
    days_lps: int
    employed: bool
    benefits: bool
    driver: bool
    vdu: bool
    varifocal: bool
    high_rx: bool
    appointment_date: datetime
    amount_spent: float
    predicted_spend: float  # ADD THIS!
    created_at: datetime

    class Config:
        from_attributes = True

# legacy schemas

class PatientInput(BaseModel):

    id: int
    age: int
    employed: bool
    benefits: bool
    driver: bool
    vdu: bool
    high_rx: bool
    varifocal: bool
    days_lps: int


class PredictionOutput(BaseModel):

    purchase_probability: float
    predicted_spend: float


#utility

class MessageResponse(BaseModel):

    message: str
    details: Optional[dict] = None