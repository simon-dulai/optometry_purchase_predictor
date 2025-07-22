from database import Patient, Prediction, create_tables, get_db

# Create the database and tables
print("Creating database...")
create_tables()
print("Database created successfully!")

# Test adding a patient
print("Testing database connection...")
db = next(get_db())

# Create a test patient
test_patient = Patient(
    age=35,
    days_lps=365,
    employed=True,
    benefits=False,
    driver=True,
    vdu=True,
    varifocal=False,
    high_rx=False
)

# Add to database
db.add(test_patient)
db.commit()
print("Test patient added successfully!")

# Let's see what we stored
print("\n--- Checking what's in the database ---")
db = next(get_db())

# Get all patients
patients = db.query(Patient).all()
print(f"Number of patients in database: {len(patients)}")

for patient in patients:
    print(f"Patient {patient.id}: Age {patient.age}, Days since last purchase: {patient.days_lps}")
    print(f"Employed: {patient.employed}, VDU user: {patient.vdu}")

db.close()