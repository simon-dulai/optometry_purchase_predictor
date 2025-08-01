# Optometry Purchase Predictor

A full-stack machine learning application that predicts customer purchase likelihood and spending amounts for optometry practices.

## 🎯 Project Overview

This application uses machine learning to help optometry practices:
- Predict the likelihood of a patient spending over £100
- Estimate expected spending amounts
- Optimize sales strategies based on patient characteristics

### Key Features
- **Purchase Probability Prediction**: Random Forest classifier predicting >£100 spend likelihood
- **Spending Amount Estimation**: Linear regression model for expected purchase amount
- **RESTful API**: FastAPI backend for model inference
- **Web Interface**: User-friendly frontend for predictions
- **Data Management**: PostgreSQL database for patient data and prediction history

## 🏗️ Project Structure

```
optometry-purchase-predictor/
├── backend/           # FastAPI application
├── frontend/          # Web interface  
├── docs/             # Documentation
├── data/             # Data files
├── models/           # Trained ML models
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

## 🚀 Development Phases

- [x] **Phase 1**: Foundation (Week 1) - Project setup and structure
- [x] **Phase 2**: Backend API (Weeks 2-5) - FastAPI endpoints
- [x] **Phase 3**: Database (Weeks 6-8) - PostgreSQL integration  
- [ ] **Phase 4**: Frontend (Weeks 9-12) - Web interface
- [ ] **Phase 5**: Deployment (Weeks 13-16) - Production deployment
- [ ] **Phase 6**: Polish (Weeks 17-20) - Final improvements

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Git
- Virtual environment support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd optometry-purchase-predictor
```

2. **Set up virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

4. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

## 📊 Model Information

### Purchase Predictor (Classification)
- **Algorithm**: Random Forest Classifier
- **Target**: Binary classification (spend ≥£100)
- **Features**: Age, Days since last purchase, Employment status, Benefits, Driver status, VDU use, Varifocal wear, High Rx
- **Accuracy**: ~XX% (to be updated)

### Price Predictor (Regression)  
- **Algorithm**: Linear Regression with StandardScaler
- **Target**: Continuous spending amount (£0-£500)
- **Features**: Same as classification model
- **Performance**: MAE: XX, R²: XX (to be updated)

## 🧪 Testing

```bash
# Run all tests
pytest

# Run backend tests only
pytest backend/tests/

# Run with coverage
pytest --cov=backend/app
```

## 📝 API Documentation

Once the backend is running (Phase 2), API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`


### Future Usage (Post Phase 2)
```bash
# Start backend server
cd backend
uvicorn app.main:app --reload

# Access web interface
# Navigate to http://localhost:8000
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


