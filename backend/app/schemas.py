from pydantic import BaseModel

class PatientInput(BaseModel):
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

