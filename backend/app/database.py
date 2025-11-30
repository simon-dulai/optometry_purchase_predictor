from sqlalchemy import Column, Integer, Boolean, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


# ============================================
# USER TABLE
# ============================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    practice_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    patients = relationship("Patient", back_populates="user", cascade="all, delete-orphan")
    past_appointments = relationship("Past", back_populates="user", cascade="all, delete-orphan")


# ============================================
# PATIENT TABLE (Updated with user_id and appointment_date)
# ============================================

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    days_lps = Column(Integer, nullable=False)
    employed = Column(Boolean, nullable=False)
    benefits = Column(Boolean, nullable=False)
    driver = Column(Boolean, nullable=False)
    vdu = Column(Boolean, nullable=False)
    varifocal = Column(Boolean, nullable=False)
    high_rx = Column(Boolean, nullable=False)
    appointment_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    predicted_spend = Column(Float, nullable=True)  # Add this line to Past model
    # Relationships
    user = relationship("User", back_populates="patients")
    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete-orphan")


# ============================================
# PREDICTION TABLE (Updated)
# ============================================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    purchase_probability = Column(Float, nullable=False)
    predicted_spend = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship back to patient
    patient = relationship("Patient", back_populates="predictions")


# ============================================
# PAST APPOINTMENTS TABLE
# ============================================

class Past(Base):
    __tablename__ = "past"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(Integer, nullable=False)  # Just stores ID as integer, no FK constraint
    age = Column(Integer, nullable=False)
    days_lps = Column(Integer, nullable=False)
    employed = Column(Boolean, nullable=False)
    benefits = Column(Boolean, nullable=False)
    driver = Column(Boolean, nullable=False)
    vdu = Column(Boolean, nullable=False)
    varifocal = Column(Boolean, nullable=False)
    high_rx = Column(Boolean, nullable=False)
    appointment_date = Column(DateTime, nullable=False, index=True)
    amount_spent = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    predicted_spend = Column(Float, nullable=True)  # Add this line to Past model

    # Relationship
    user = relationship("User", back_populates="past_appointments")


# ============================================
# DATABASE CONNECTION
# ============================================

import os
from pathlib import Path

# Get the directory where this database.py file is located
BASE_DIR = Path(__file__).resolve().parent

# Use PostgreSQL in production (Render), SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Create SQLite database in the backend directory (where database.py is)
    db_path = BASE_DIR / "optometry.db"
    DATABASE_URL = f"sqlite:///{db_path}"

# Render provides DATABASE_URL starting with "postgres://" but SQLAlchemy needs "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs check_same_thread=False, PostgreSQL doesn't
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)


# Get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()