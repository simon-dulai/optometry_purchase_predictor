from fastapi import FastAPI
from .schemas import PatientInput, PredictionOutput
from .database import Patient, Prediction, create_tables, get_db


#& "C:/Users/Ms Pro 7/PycharmProjects/optometry_purchase_predictor/.venv/Scripts/Activate.ps1"

app = FastAPI()

from .models import forest_classifier as fc
from .models import linear_classifier as lc





# Initialize models
forest_model = fc.Forest()
linear_model = lc.Linear()
create_tables()



# Train the models when API starts
print("Training Forest model...")
x, y = forest_model.prepare_rf("data")
forest_model.train_rf(x, y)

print("Training Linear model...")
x2, y2 = linear_model.prepare_lp()
linear_model.train_lp(x2, y2)

print("Models loaded successfully!")


@app.get("/")
def read_root():
    return {"message": "Hello Sexy"}


@app.post("/predict")
def predict(patient: PatientInput):
    # Extract patient data (always works)
    id = patient.id
    age = patient.age
    employed = patient.employed
    benefits = patient.benefits
    driver = patient.driver
    vdu = patient.vdu
    varifocal = patient.varifocal
    high_rx = patient.high_rx
    days_lps = patient.days_lps

    # Do ML predictions FIRST (always works)
    employed_num = 1 if employed else 0
    benefits_num = 0 if benefits else 1
    driver_num = 1 if driver else 0
    vdu_num = 1 if vdu else 0
    varifocal_num = 1 if varifocal else 0
    highrx_num = 1 if high_rx else 0

    features = [age, days_lps, employed_num, benefits_num, driver_num, vdu_num, varifocal_num, highrx_num]
    probability, percentage = forest_model.probability_cal([features])
    predicted_spend = linear_model.predict_spending(features, linear_model.scaler)

    # Try database operations (might fail)
    try:
        db = next(get_db())
        print("✅ Database connected")

        px = Patient(id=id, age=age, employed=employed, benefits=benefits,
                     driver=driver, vdu=vdu, varifocal=varifocal, high_rx=high_rx,
                     days_lps=days_lps)

        db.add(px)
        db.commit()
        print(f"✅ Patient {id} saved")

        pred = Prediction(patient_id=id, purchase_probability=probability, predicted_spend=predicted_spend)
        db.add(pred)
        db.commit()
        print(f"✅ Prediction saved")

        db.close()

    except Exception as e:
        print(f"❌ Database error: {e}")

    # Always return results (whether database worked or not)
    return {"purchase_probability": probability, "purchase_probability_percent": percentage,
            "predicted_spend": predicted_spend}


@app.get("/patients")
def get_all_patients():
    db = next(get_db())
    patients = db.query(Patient).all()

    # Convert to JSON format
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
            "high_rx": patient.high_rx# Add other fields you want to show
        }
        patient_list.append(patient_data)

    db.close()
    return {"patients": patient_list, "count": len(patient_list)}

@app.get("/predictions")
def get_all_predictions():
    db = next(get_db())

    # Get all patients
    predictions = db.query(Prediction).all()
    pred_list = []
    for preds in predictions:
        pred_data = {
        "id": preds.patient_id,
        "purchase_probability" : preds.purchase_probability,
        "predicted_spend" : preds.predicted_spend
        }

        pred_list.append(pred_data)
    db.close()
    return {"predictions": pred_list, "count": len(pred_list)}



