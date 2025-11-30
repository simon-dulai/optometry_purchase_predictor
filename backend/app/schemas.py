from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ============================================
# AUTH SCHEMAS
# ============================================

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


# ============================================
# CSV UPLOAD SCHEMAS
# ============================================

class UpcomingAppointmentCSV(BaseModel):
    """For bulk uploading upcoming appointments"""
    id: int
    age: int
    days_lps: int
    employed: str  # "Y" or "N" from CSV
    benefits: str  # "Y" or "N" from CSV
    driver: str    # "Y" or "N" from CSV
    vdu: str       # "Y" or "N" from CSV
    varifocal: str # "Y" or "N" from CSV
    high_rx: str   # "Y" or "N" from CSV
    appointment_date: str  # Will be parsed to datetime


class PastAppointmentCSV(BaseModel):
    """For bulk uploading past appointments with actual spend"""
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


# ============================================
# RESPONSE SCHEMAS
# ============================================

class PatientResponse(BaseModel):
    """Patient data with prediction for table view"""
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
    """Weekly sales forecast"""
    date: str  # YYYY-MM-DD format
    total_predicted: float


class MonthlySalesResponse(BaseModel):
    """Monthly actual vs predicted comparison"""
    month: str  # YYYY-MM format
    total_predicted: float
    total_actual: float
    variance: float  # actual - predicted


class PastAppointmentResponse(BaseModel):
    """Past appointment data"""
    id: int
    patient_id: int
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
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# LEGACY SCHEMAS (Keep for backward compatibility)
# ============================================

class PatientInput(BaseModel):
    """Legacy single patient predictor input"""
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
    """Legacy prediction output"""
    purchase_probability: float
    predicted_spend: float


# ============================================
# UTILITY SCHEMAS
# ============================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    details: Optional[dict] = None