import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .schemas import PatientInput, PredictionOutput
from .database import Patient, Prediction, create_tables, get_db
from .models import forest_classifier as fc
from .models import linear_classifier as lc

app = FastAPI(title="Optometry Purchase Predictor", version="1.0.0")

# CORS configuration for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="../frontend"), name="static")


forest_model = fc.Forest()
linear_model = lc.Linear()


@app.on_event("startup")
async def startup_event():

    create_tables()

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


@app.get("/")
def read_root():

    return FileResponse('../frontend/predictor.html')


@app.get("/health")
def health_check():

    return {"status": "healthy", "message": "Optometry Purchase Predictor API is running"}


@app.post("/predict", response_model=dict)
def predict(patient: PatientInput, db: Session = Depends(get_db)):

    try:

        id = patient.id
        age = patient.age
        employed = patient.employed
        benefits = patient.benefits
        driver = patient.driver
        vdu = patient.vdu
        varifocal = patient.varifocal
        high_rx = patient.high_rx
        days_lps = patient.days_lps


        employed_num = 1 if employed else 0
        benefits_num = 0 if benefits else 1
        driver_num = 1 if driver else 0
        vdu_num = 1 if vdu else 0
        varifocal_num = 1 if varifocal else 0
        highrx_num = 1 if high_rx else 0


        features = [age, days_lps, employed_num, benefits_num, driver_num, vdu_num, varifocal_num, highrx_num]


        probability, percentage = forest_model.probability_cal([features])
        predicted_spend = linear_model.predict_spending(features, linear_model.scaler)


        try:

            existing_patient = db.query(Patient).filter(Patient.id == id).first()

            if not existing_patient:

                px = Patient(id=id, age=age, employed=employed, benefits=benefits,
                             driver=driver, vdu=vdu, varifocal=varifocal, high_rx=high_rx,
                             days_lps=days_lps)
                db.add(px)
                db.commit()
                print(f"✅ New patient {id} saved")
            else:
                print(f"ℹ️ Patient {id} already exists - skipping")


            pred = Prediction(patient_id=id, purchase_probability=probability, predicted_spend=predicted_spend)
            db.add(pred)
            db.commit()
            print(f"✅ Prediction saved")

        except Exception as e:
            print(f"❌ Database error: {e}")
            db.rollback()


        return {
            "purchase_probability": probability,
            "purchase_probability_percent": percentage,
            "predicted_spend": predicted_spend
        }

    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return {"error": str(e)}, 500


@app.get("/patients")
def get_all_patients(db: Session = Depends(get_db)):

    try:
        patients = db.query(Patient).all()
        patient_list = []
        for patient in patients:
            patient_data = {
                "id": patient.id,
                "age": patient.age,
                "days_lps": patient.days_lps,
                "employed": patient.employed,
                "benefits": patient.benefits,
                "driver": patient.driver,
                "vdu": patient.vdu,
                "varifocal": patient.varifocal,
                "high_rx": patient.high_rx
            }
            patient_list.append(patient_data)
        return {"patients": patient_list, "count": len(patient_list)}
    except Exception as e:
        return {"error": str(e)}, 500


@app.get("/predictions")
def get_all_predictions(db: Session = Depends(get_db)):

    try:
        predictions = db.query(Prediction).all()
        pred_list = []
        for preds in predictions:
            pred_data = {
                "id": preds.patient_id,
                "purchase_probability": preds.purchase_probability,
                "predicted_spend": preds.predicted_spend
            }
            pred_list.append(pred_data)
        return {"predictions": pred_list, "count": len(pred_list)}
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)