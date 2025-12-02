# OptoCom - ML Optical Purchase Forecast (2.0)
[Demo](https://optocom.up.railway.app)

## Using OptoCom
1. Register with a new username, email, password, and practice name
2. Download demo CSV files to test the prediction system
3. Upload past appointments CSV to train predictions with actual sales data
4. Upload upcoming appointments CSV to generate purchase predictions
5. View predicted vs actual sales in the interactive forecast graph
6. Browse patient-by-patient predictions in the color-coded table
7. Use the legacy predictor for single-patient predictions without login (V1.0)

## Overview
OptoCom is a sales analysis application that uses machine learning to predict patient purchasing behavior in Optometry practices. The system uses patient demographics, purchase history and prescription factors to forecast sales revenue and purchase probability, enabling practices to optimise sales strategies and serve as a new KPI for practices.

Target Audience: Optometry Practice Managers & Business Analysts

## Features:
- JWT implementation allows secure multi-user authentication
- Machine Learning prediction engine using Random Forest Classification and Linear Regression
- Interactive forecast dashboard with future sales predictions and comparative actual vs predicted values
- CSV bulk upload system for integration with existing practice management software
- Color-coded patient table highlighting high/medium/low value predictions
- Real-time prediction calculation as data is uploaded
- Demo CSV generator with realistic optometry data for testing

## Tech Stack:
**Frontend:** React, JavaScript, Vite, Custom Cyberpunk CSS Style

**Backend:** Python, FastAPI, SQLAlchemy

**Database:** PostgreSQL (Railway), SQLite (local development)

**Machine Learning:** scikit-learn (Random Forest, Linear Regression, StandardScaler)

**Authentication:** JWT, bcrypt

**Deployment:** Railway (Frontend + Backend + PostgreSQL)

**Version Control:** Git, GitHub

## Project Structure
```
optocom/
├── backend/
│   ├── app/
│   │   ├── auth.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── demo_csv_generator.py
│   │   └── models/
│   │   |   ├── forest_classifier.py
│   │   |   └── linear_classifier.py
│   |   ├── data/
│   |   |   └── realistic_optometry_data_10000.csv
│   |   ├── requirements.txt
│   |   └── predictor2.html
│   |
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
|   |   |   └── Register.jsx
│   │   ├── components/
│   │   │   ├── CSVUpload.jsx
│   │   │   ├── PatientTable.jsx
│   │   │   ├── ForecastGraph.jsx
│   │   │   └── ClearDataButton.jsx
|   |   |   └── Navbar.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── styles/
│   │       └── cyberpunk.css
│   ├── public/
│   └── package.json
└── README.md
```

## API Endpoints

### Public Endpoints
1. **GET /** → Welcome endpoint
2. **GET /predictor2.html** → Serve legacy predictor interface
3. **GET /demo/past-csv** → Download demo past appointments CSV
4. **GET /demo/upcoming-csv** → Download demo upcoming appointments CSV
5. **POST /predict** → Legacy single patient prediction (no auth required)

### Authentication Endpoints
6. **POST /register** → Create new user account with practice details
7. **POST /login** → Login and receive JWT access token
8. **GET /me** → Get current authenticated user information

### Data Upload Endpoints (Protected — require JWT)
9. **POST /upload/past** → Upload past appointments CSV with actual sales data
10. **POST /upload/upcoming** → Upload upcoming appointments CSV for predictions

### Data Retrieval Endpoints (Protected — require JWT)
11. **GET /patients/date/{date}** → Get upcoming appointments with predictions for specific date
12. **GET /past/date/{date}** → Get past appointments with predictions for specific date
13. **GET /forecast/weekly** → Get 7-day sales forecast
14. **GET /forecast/monthly** → Get monthly actual vs predicted comparison

### Data Management Endpoints (Protected — require JWT)
15. **DELETE /clear-data** → Clear all user data (patients and past appointments)

## Machine Learning Models

### Purchase Probability Model (Random Forest Classifier)
- **Purpose:** Predicts likelihood of patient making a purchase (≥£100) to overcome equal weighting binary values
- **Features:** Age, Days since last purchase, Employment status, Benefits, Driver, VDU user, Varifocal need, High prescription
- **Output:** Probability score (0-1) and percentage

### Purchase Amount Model (Linear Regression with StandardScaler)
- **Purpose:** Predicts expected purchase amount for patients
- **Features:** Same 8 features as classification model
- **Preprocessing:** StandardScaler for feature normalization
- **Output:** Predicted spend in £

### Training Data
- 10,000 synthetic patient records
- Binary encoding for categorical variables (Y/N → 1/0)
- Train/test split: 80/20
- Models trained on application startup

## Deployment
The application is deployed on [Railway](https://optocom.up.railway.app) with the following production setup:
- Separate frontend and backend services
- PostgreSQL database with automatic backups
- Environment variables for secure credential management
- CORS configuration for cross-origin requests
- ML models trained on startup
- Health monitoring and automatic restarts

## Future Improvements

### Functional Improvements
- [ ] Implement appointment reminder system with purchase probability alerts
- [ ] Develop A/B testing framework for prediction model optimisation
- [ ] Create automated patient organisation recommendations based on predicted demand
- [ ] Add export functionality for accounting integration
- [ ] Implement real-time prediction updates as appointments are completed

### Availability Improvements
- [ ] Containerize with Docker for easier deployment
- [ ] Implement Redis caching for faster predictions
- [ ] Add model versioning and A/B testing infrastructure
- [ ] Create automated model retraining pipeline with new data
- [ ] Add comprehensive unit and integration test coverage

