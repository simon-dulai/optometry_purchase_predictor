from fastapi import FastAPI
from .schemas import PatientInput, PredictionOutput

app = FastAPI()

from .models import forest_classifier as fc
from .models import linear_classifier as lc

# Initialize models
forest_model = fc.Forest()
linear_model = lc.Linear()

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
    age = patient.age
    employed = patient.employed
    benefits = patient.benefits
    driver = patient.driver
    vdu = patient.vdu
    varifocal = patient.varifocal
    high_rx = patient.high_rx
    days_lps = patient.days_lps

    employed_num = 1 if employed else 0
    benefits_num = 0 if benefits else 1  # Note: inverted logic!
    driver_num = 1 if driver else 0
    vdu_num = 1 if vdu else 0
    varifocal_num = 1 if varifocal else 0
    highrx_num = 1 if high_rx else 0

    features = [age, days_lps, employed_num, benefits_num, driver_num, vdu_num, varifocal_num, highrx_num]

    probability, percentage = forest_model.probability_cal([features])
    predicted_spend = linear_model.predict_spending(features, linear_model.scaler)

    return {"purchase_probability": probability,  "purchase_probability_percent": percentage, "predicted_spend": predicted_spend}
