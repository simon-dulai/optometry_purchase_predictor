from sqlalchemy import Column, Integer, Boolean, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=False)
    age = Column(Integer, nullable=False)
    days_lps = Column(Integer, nullable=False)
    employed = Column(Boolean, nullable=False)
    benefits = Column(Boolean, nullable=False)
    driver = Column(Boolean, nullable=False)
    vdu = Column(Boolean, nullable=False)
    varifocal = Column(Boolean, nullable=False)
    high_rx = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to predictions
    predictions = relationship("Prediction", back_populates="patient")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    purchase_probability = Column(Float, nullable=False)
    predicted_spend = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to patient
    patient = relationship("Patient", back_populates="predictions")


# Database connection
DATABASE_URL = "sqlite:///./optometry.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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