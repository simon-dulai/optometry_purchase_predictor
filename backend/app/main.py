import os
import io
import csv
from datetime import datetime, timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.responses import StreamingResponse


from demo_csv_generator import get_demo_past_csv, get_demo_upcoming_csv
import io

from schemas import (
    PatientInput, PredictionOutput,
    UserCreate, UserLogin, Token, UserResponse,
    PatientResponse, WeeklySalesResponse, MonthlySalesResponse,
    MessageResponse, PastAppointmentResponse
)
from database import Patient, Prediction, User, Past, create_tables, get_db
from models import forest_classifier as fc
from models import linear_classifier as lc
from auth import hash_password, verify_password, create_access_token, get_current_user_id

app = FastAPI(title="Optometry Purchase Predictor V2.0", version="2.0.0")


CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # In production, replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend (will be React app)
# app.mount("/static", StaticFiles(directory="../frontend/build"), name="static")

# Initialize ML models
forest_model = fc.Forest()
linear_model = lc.Linear()


@app.on_event("startup")
async def startup_event():
    """Initialize database and train ML models on startup"""

    create_tables()
    print("✅ Database tables created")

    print("Training Forest model...")
    try:
        x, y = forest_model.prepare_rf("data")
        forest_model.train_rf(x, y)
        print("✅ Forest model trained successfully!")
    except Exception as e:
        print(f"❌ Forest model training failed: {e}")

    print("Training Linear model...")
    try:
        x2, y2 = linear_model.prepare_lp()
        linear_model.train_lp(x2, y2)
        print("✅ Linear model trained successfully!")
    except Exception as e:
        print(f"❌ Linear model training failed: {e}")


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Optometry Purchase Predictor V2.0 is running"}


# ============================================
# AUTH ENDPOINTS
# ============================================

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""

    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        practice_name=user_data.practice_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT token"""

    # Find user
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"user_id": user.id})

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=UserResponse)
def get_current_user(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get current user info"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# ============================================
# CSV UPLOAD ENDPOINTS
# ============================================

def convert_yn_to_bool(value: str) -> bool:
    """Convert Y/N string to boolean"""
    return value.strip().upper() == 'Y'


def predict_for_patient(age: int, days_lps: int, employed: bool, benefits: bool,
                        driver: bool, vdu: bool, varifocal: bool, high_rx: bool):
    """Generate prediction for a patient"""

    # Convert to model format
    employed_num = 1 if employed else 0
    benefits_num = 0 if benefits else 1  # Note: inverted
    driver_num = 1 if driver else 0
    vdu_num = 1 if vdu else 0
    varifocal_num = 1 if varifocal else 0
    high_rx_num = 1 if high_rx else 0

    features = [age, days_lps, employed_num, benefits_num, driver_num, vdu_num, varifocal_num, high_rx_num]

    # Get predictions
    probability, percentage = forest_model.probability_cal([features])
    predicted_spend = linear_model.predict_spending(features, linear_model.scaler)

    return probability, predicted_spend


@app.post("/upload/upcoming", response_model=MessageResponse)
async def upload_upcoming_csv(
        file: UploadFile = File(...),
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Upload upcoming appointments CSV and generate predictions"""

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))

        patients_created = 0
        predictions_created = 0

        for row in csv_reader:
            # Parse CSV row
            patient_id = int(row['id'])
            age = int(row['age'])
            days_lps = int(row['days_lps'])
            employed = convert_yn_to_bool(row['employed'])
            benefits = convert_yn_to_bool(row['benefits'])
            driver = convert_yn_to_bool(row['driver'])
            vdu = convert_yn_to_bool(row['vdu'])
            varifocal = convert_yn_to_bool(row['varifocal'])
            high_rx = convert_yn_to_bool(row['high_rx'])
            appointment_date = datetime.fromisoformat(row['appointment_date'])

            # Check if patient already exists for this user
            existing = db.query(Patient).filter(
                Patient.patient_id == patient_id,
                Patient.user_id == user_id
            ).first()

            if existing:
                continue  # Skip duplicates

            # Create patient
            patient = Patient(
                patient_id=patient_id,
                user_id=user_id,
                age=age,
                days_lps=days_lps,
                employed=employed,
                benefits=benefits,
                driver=driver,
                vdu=vdu,
                varifocal=varifocal,
                high_rx=high_rx,
                appointment_date=appointment_date
            )

            db.add(patient)
            patients_created += 1

            # Generate prediction
            probability, predicted_spend = predict_for_patient(
                age, days_lps, employed, benefits, driver, vdu, varifocal, high_rx
            )

            db.flush()  # Get the auto-generated id for the patient we just added

            prediction = Prediction(
                patient_id=patient.id,  # ✅ Use the DB-generated id
                purchase_probability=probability,
                predicted_spend=predicted_spend
            )

            db.add(prediction)
            predictions_created += 1

        db.commit()

        return MessageResponse(
            message=f"Successfully uploaded {patients_created} patients and generated {predictions_created} predictions",
            details={"patients": patients_created, "predictions": predictions_created}
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


@app.post("/upload/past", response_model=MessageResponse)
async def upload_past_csv(
        file: UploadFile = File(...),
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Upload past appointments CSV with actual spend amounts and generate predictions"""

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))

        records_created = 0

        for row in csv_reader:
            # Parse CSV row
            patient_id = int(row['id'])
            age = int(row['age'])
            days_lps = int(row['days_lps'])
            employed = convert_yn_to_bool(row['employed'])
            benefits = convert_yn_to_bool(row['benefits'])
            driver = convert_yn_to_bool(row['driver'])
            vdu = convert_yn_to_bool(row['vdu'])
            varifocal = convert_yn_to_bool(row['varifocal'])
            high_rx = convert_yn_to_bool(row['high_rx'])
            appointment_date = datetime.fromisoformat(row['appointment_date'])
            amount_spent = float(row['amount_spent'])

            # Generate prediction for comparison purposes
            probability, predicted_spend = predict_for_patient(
                age, days_lps, employed, benefits, driver, vdu, varifocal, high_rx
            )

            # Create past record with both actual and predicted spend
            past_record = Past(
                user_id=user_id,
                patient_id=patient_id,
                age=age,
                days_lps=days_lps,
                employed=employed,
                benefits=benefits,
                driver=driver,
                vdu=vdu,
                varifocal=varifocal,
                high_rx=high_rx,
                appointment_date=appointment_date,
                amount_spent=amount_spent,
                predicted_spend=predicted_spend
            )

            print("PAST PREDICTION DEBUG →", {
                "id": patient_id,
                "features": [age, days_lps, employed, benefits, driver, vdu, varifocal, high_rx],
                "predicted_spend": predicted_spend,
                "probability": probability
            })

            db.add(past_record)
            records_created += 1

        db.commit()

        return MessageResponse(
            message=f"Successfully uploaded {records_created} past appointments with predictions",
            details={"records": records_created}
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")




# ============================================
# DATA RETRIEVAL ENDPOINTS
# ============================================

@app.get("/patients/date/{date}", response_model=List[PatientResponse])
def get_patients_by_date(
        date: str,
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Get all patients for a specific date with predictions"""

    try:
        target_date = datetime.fromisoformat(date).date()
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Query patients for this user on this date
    patients = db.query(Patient).filter(
        Patient.user_id == user_id,
        func.date(Patient.appointment_date) == target_date
    ).all()

    # Build response with predictions
    result = []
    for patient in patients:
        prediction = db.query(Prediction).filter(
            Prediction.patient_id == patient.id
        ).first()

        if prediction:
            result.append({
                "id": patient.id,
                "age": patient.age,
                "days_lps": patient.days_lps,
                "employed": patient.employed,
                "benefits": patient.benefits,
                "driver": patient.driver,
                "vdu": patient.vdu,
                "varifocal": patient.varifocal,
                "high_rx": patient.high_rx,
                "appointment_date": patient.appointment_date,
                "predicted_spend": prediction.predicted_spend,
                "purchase_probability": prediction.purchase_probability,
                "created_at": patient.created_at
            })

    return result


@app.get("/past", response_model=List[PastAppointmentResponse])
def get_all_past_appointments(
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Get all past appointments for the current user"""

    past_records = db.query(Past).filter(Past.user_id == user_id).all()

    result = []
    for record in past_records:
        result.append({
            "id": record.patient_id,
            "age": record.age,
            "days_lps": record.days_lps,
            "employed": record.employed,
            "benefits": record.benefits,
            "driver": record.driver,
            "vdu": record.vdu,
            "varifocal": record.varifocal,
            "high_rx": record.high_rx,
            "appointment_date": record.appointment_date,
            "amount_spent": record.amount_spent,
            "predicted_spend": record.predicted_spend,  # <-- ADD THIS
            "created_at": record.created_at
        })

    return result


@app.get("/past/date/{date}", response_model=List[PastAppointmentResponse])
def get_past_by_date(
        date: str,
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Get all past appointments for a specific date"""

    try:
        target_date = datetime.fromisoformat(date).date()
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    past_records = db.query(Past).filter(
        Past.user_id == user_id,
        func.date(Past.appointment_date) == target_date
    ).all()

    result = []
    for record in past_records:
        result.append({
            "id": record.patient_id,
            "age": record.age,
            "days_lps": record.days_lps,
            "employed": record.employed,
            "benefits": record.benefits,
            "driver": record.driver,
            "vdu": record.vdu,
            "varifocal": record.varifocal,
            "high_rx": record.high_rx,
            "appointment_date": record.appointment_date,
            "amount_spent": record.amount_spent,
            "predicted_spend": record.predicted_spend,  # <-- ADD THIS
            "created_at": record.created_at
        })

    return result

@app.get("/analytics/weekly", response_model=List[WeeklySalesResponse])
def get_weekly_forecast(
        start_date: str,
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Get weekly sales forecast for 4 weeks starting from start_date"""

    try:
        start = datetime.fromisoformat(start_date).date()
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    weekly_data = []

    for week in range(4):
        week_start = start + timedelta(days=week * 7)
        week_end = week_start + timedelta(days=6)

        # Get all patients in this week
        patients = db.query(Patient).filter(
            Patient.user_id == user_id,
            func.date(Patient.appointment_date) >= week_start,
            func.date(Patient.appointment_date) <= week_end
        ).all()

        # Sum predictions
        total_predicted = 0.0
        for patient in patients:
            prediction = db.query(Prediction).filter(
                Prediction.patient_id == patient.id
            ).first()
            if prediction:
                total_predicted += prediction.predicted_spend

        weekly_data.append({
            "date": week_start.isoformat(),
            "total_predicted": round(total_predicted, 2)
        })

    return weekly_data


@app.get("/analytics/monthly", response_model=MonthlySalesResponse)
def get_monthly_comparison(
        month: str,
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Get monthly actual vs predicted comparison (format: YYYY-MM)"""

    try:
        year, month_num = month.split('-')
        year = int(year)
        month_num = int(month_num)
    except:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    # Get month boundaries
    month_start = datetime(year, month_num, 1).date()
    if month_num == 12:
        month_end = datetime(year + 1, 1, 1).date()
    else:
        month_end = datetime(year, month_num + 1, 1).date()

    # Calculate predicted total
    patients = db.query(Patient).filter(
        Patient.user_id == user_id,
        func.date(Patient.appointment_date) >= month_start,
        func.date(Patient.appointment_date) < month_end
    ).all()

    total_predicted = 0.0
    for patient in patients:
        prediction = db.query(Prediction).filter(
            Prediction.patient_id == patient.id
        ).first()
        if prediction:
            total_predicted += prediction.predicted_spend

    # Calculate actual total from past appointments
    past_records = db.query(Past).filter(
        Past.user_id == user_id,
        func.date(Past.appointment_date) >= month_start,
        func.date(Past.appointment_date) < month_end
    ).all()

    total_actual = sum(record.amount_spent for record in past_records)

    variance = total_actual - total_predicted

    return {
        "month": month,
        "total_predicted": round(total_predicted, 2),
        "total_actual": round(total_actual, 2),
        "variance": round(variance, 2)
    }


# ============================================
# DATA MANAGEMENT ENDPOINTS
# ============================================

@app.delete("/data/clear", response_model=MessageResponse)
def clear_user_data(
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Clear all user's patient, prediction, and past appointment data"""

    # Delete all patients (cascade will delete predictions)
    patients_deleted = db.query(Patient).filter(Patient.user_id == user_id).delete()

    # Delete all past appointments
    past_deleted = db.query(Past).filter(Past.user_id == user_id).delete()

    db.commit()

    return MessageResponse(
        message="All data cleared successfully",
        details={
            "patients_deleted": patients_deleted,
            "past_records_deleted": past_deleted
        }
    )


# ============================================
# DEMO/UTILITY ENDPOINTS
# ============================================

@app.get("/demo/csv/upcoming")
def download_demo_upcoming_csv():
    """Generate and download a demo upcoming appointments CSV"""

    csv_content = """id,age,days_lps,employed,benefits,driver,vdu,varifocal,high_rx,appointment_date
1001,45,365,Y,N,Y,Y,Y,N,2024-12-05 09:00:00
1002,32,180,Y,Y,N,Y,N,N,2024-12-05 10:00:00
1003,58,730,N,N,Y,N,Y,Y,2024-12-05 14:00:00
1004,41,450,Y,N,Y,Y,Y,N,2024-12-06 09:30:00
1005,67,90,N,N,Y,N,Y,Y,2024-12-06 11:00:00"""

    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=demo_upcoming.csv"}
    )


@app.get("/demo/csv/past")
def download_demo_past_csv():
    """Generate and download a demo past appointments CSV"""

    csv_content = """id,age,days_lps,employed,benefits,driver,vdu,varifocal,high_rx,appointment_date,amount_spent
2001,55,400,Y,N,Y,Y,Y,N,2024-11-15 09:00:00,165.50
2002,38,200,Y,Y,N,Y,N,N,2024-11-16 10:00:00,45.00
2003,62,800,N,N,Y,N,Y,Y,2024-11-17 14:00:00,220.75
2004,44,500,Y,N,Y,Y,Y,N,2024-11-18 09:30:00,135.00
2005,70,100,N,N,Y,N,Y,Y,2024-11-19 11:00:00,189.25"""

    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=demo_past.csv"}
    )


# ============================================
# LEGACY ENDPOINTS (For backward compatibility)
# ============================================

@app.get("/")
def read_root():
    """Serve legacy predictor or redirect to React app"""
    return {"message": "Optometry Purchase Predictor V2.0 API", "version": "2.0.0"}


@app.post("/predict", response_model=dict)
def legacy_predict(patient: PatientInput, db: Session = Depends(get_db)):
    """Legacy single patient prediction endpoint (no auth required for backward compatibility)"""

    try:
        # Generate prediction
        probability, predicted_spend = predict_for_patient(
            patient.age, patient.days_lps, patient.employed, patient.benefits,
            patient.driver, patient.vdu, patient.varifocal, patient.high_rx
        )

        percentage = probability * 100

        return {
            "purchase_probability": probability,
            "purchase_probability_percent": percentage,
            "predicted_spend": predicted_spend
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

""" DEMO CSV UPDATE """


@app.get("/demo/past-csv")
def download_demo_past_csv():
    """
    Download dynamically generated demo CSV for past appointments
    Always centered around today's date - 2 months of past data
    """
    csv_content, filename = get_demo_past_csv()

    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8')),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.get("/demo/upcoming-csv")
def download_demo_upcoming_csv():
    """
    Download dynamically generated demo CSV for upcoming appointments
    Always centered around today's date - 1 month of future data
    """
    csv_content, filename = get_demo_upcoming_csv()

    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8')),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
#test
#testgitpush

@app.get("/past/date/{date}", response_model=List[PastAppointmentResponse])
def get_past_by_date(
        date: str,
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    """Get past appointments for a specific date with predictions"""
    try:
        target_date = datetime.fromisoformat(date).date()
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")

    past_records = db.query(Past).filter(
        Past.user_id == user_id,
        func.date(Past.appointment_date) == target_date
    ).all()

    for record in past_records:
        if not record.predicted_spend or record.predicted_spend == 0:
            features = [record.age, record.days_lps, record.employed, record.benefits,
                        record.driver, record.vdu, record.varifocal, record.high_rx]
            record.predicted_spend = float(linear_model.predict_spending(features, linear_model.scaler))

    return past_records


@app.get("/predictor2.html")
async def serve_predictor():
    """Serve the legacy predictor HTML"""
    html_path = os.path.join(os.path.dirname(__file__), "predictor2.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    raise HTTPException(status_code=404, detail="Predictor page not found")


@app.get("/debug/check-predictor")
async def check_predictor():
    """Debug endpoint to check if predictor2.html exists"""
    base_dir = os.path.dirname(__file__)
    predictor_path = os.path.join(base_dir, "predictor2.html")

    return {
        "base_dir": base_dir,
        "predictor_path": predictor_path,
        "exists": os.path.exists(predictor_path),
        "files_in_dir": os.listdir(base_dir)
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
