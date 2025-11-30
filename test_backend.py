"""
Backend API Test Script
Tests all endpoints for the Optometry Purchase Predictor V2.0
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL - adjust if running on different port
BASE_URL = "http://localhost:8000"

# Test data
test_user = {
    "username": "testdoctor",
    "email": "test@optometry.com",
    "password": "testpass123",
    "practice_name": "Test Optometry Practice"
}

test_login_data = {
    "username": "testdoctor",
    "password": "testpass123"
}

# Store token globally
token = None


def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print()


def test_health_check():
    """Test 1: Health check"""
    response = requests.get(f"{BASE_URL}/health")
    print_response("TEST 1: Health Check", response)
    return response.status_code == 200


def test_register():
    """Test 2: Register new user"""
    response = requests.post(f"{BASE_URL}/register", json=test_user)
    print_response("TEST 2: Register User", response)
    return response.status_code == 201


def test_login():
    """Test 3: Login and get token"""
    global token
    response = requests.post(f"{BASE_URL}/login", json=test_login_data)
    print_response("TEST 3: Login", response)

    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ Token received: {token[:50]}...")
        return True
    return False


def test_get_me():
    """Test 4: Get current user info"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    print_response("TEST 4: Get Current User", response)
    return response.status_code == 200


def test_download_demo_csv():
    """Test 5: Download demo CSV files"""
    print(f"\n{'='*60}")
    print(f"🔍 TEST 5: Download Demo CSV Files")
    print(f"{'='*60}")

    # Download upcoming CSV
    response1 = requests.get(f"{BASE_URL}/demo/csv/upcoming")
    print(f"Upcoming CSV Status: {response1.status_code}")
    print(f"Content Preview:\n{response1.text[:200]}...")

    # Download past CSV
    response2 = requests.get(f"{BASE_URL}/demo/csv/past")
    print(f"\nPast CSV Status: {response2.status_code}")
    print(f"Content Preview:\n{response2.text[:200]}...")

    return response1.status_code == 200 and response2.status_code == 200


def test_upload_upcoming_csv():
    """Test 6: Upload upcoming appointments CSV"""
    headers = {"Authorization": f"Bearer {token}"}

    # Create demo CSV data
    csv_data = """id,age,days_lps,employed,benefits,driver,vdu,varifocal,high_rx,appointment_date
1001,45,365,Y,N,Y,Y,Y,N,2024-12-05 09:00:00
1002,32,180,Y,Y,N,Y,N,N,2024-12-05 10:00:00
1003,58,730,N,N,Y,N,Y,Y,2024-12-06 14:00:00"""

    files = {'file': ('upcoming.csv', csv_data, 'text/csv')}
    response = requests.post(f"{BASE_URL}/upload/upcoming", headers=headers, files=files)
    print_response("TEST 6: Upload Upcoming CSV", response)
    return response.status_code == 200


def test_upload_past_csv():
    """Test 7: Upload past appointments CSV"""
    headers = {"Authorization": f"Bearer {token}"}

    # Create demo CSV data
    csv_data = """id,age,days_lps,employed,benefits,driver,vdu,varifocal,high_rx,appointment_date,amount_spent
2001,55,400,Y,N,Y,Y,Y,N,2024-11-15 09:00:00,165.50
2002,38,200,Y,Y,N,Y,N,N,2024-11-16 10:00:00,45.00
2003,62,800,N,N,Y,N,Y,Y,2024-11-17 14:00:00,220.75"""

    files = {'file': ('past.csv', csv_data, 'text/csv')}
    response = requests.post(f"{BASE_URL}/upload/past", headers=headers, files=files)
    print_response("TEST 7: Upload Past CSV", response)
    return response.status_code == 200


def test_get_patients_by_date():
    """Test 8: Get patients for specific date"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/patients/date/2024-12-05", headers=headers)
    print_response("TEST 8: Get Patients by Date (2024-12-05)", response)
    return response.status_code == 200


def test_weekly_forecast():
    """Test 9: Get weekly forecast"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/analytics/weekly?start_date=2024-12-01", headers=headers)
    print_response("TEST 9: Weekly Forecast", response)
    return response.status_code == 200


def test_monthly_comparison():
    """Test 10: Get monthly comparison"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/analytics/monthly?month=2024-11", headers=headers)
    print_response("TEST 10: Monthly Comparison (Nov 2024)", response)
    return response.status_code == 200


def test_legacy_predict():
    """Test 11: Legacy single prediction endpoint"""
    patient_data = {
        "id": 9999,
        "age": 45,
        "employed": True,
        "benefits": False,
        "driver": True,
        "vdu": True,
        "high_rx": False,
        "varifocal": True,
        "days_lps": 365
    }

    response = requests.post(f"{BASE_URL}/predict", json=patient_data)
    print_response("TEST 11: Legacy Predict Endpoint", response)
    return response.status_code == 200


def test_clear_data():
    """Test 12: Clear all user data"""
    headers = {"Authorization": f"Bearer {token}"}

    input("⚠️  Press ENTER to test DATA CLEAR endpoint (this will delete all test data)...")

    response = requests.delete(f"{BASE_URL}/data/clear", headers=headers)
    print_response("TEST 12: Clear User Data", response)
    return response.status_code == 200


def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*60)
    print("🚀 STARTING BACKEND API TESTS")
    print("="*60)

    tests = [
        ("Health Check", test_health_check),
        ("Register User", test_register),
        ("Login", test_login),
        ("Get Current User", test_get_me),
        ("Download Demo CSVs", test_download_demo_csv),
        ("Upload Upcoming CSV", test_upload_upcoming_csv),
        ("Upload Past CSV", test_upload_past_csv),
        ("Get Patients by Date", test_get_patients_by_date),
        ("Weekly Forecast", test_weekly_forecast),
        ("Monthly Comparison", test_monthly_comparison),
        ("Legacy Predict", test_legacy_predict),
        ("Clear User Data", test_clear_data),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Error in {test_name}: {str(e)}")
            results.append((test_name, False))

    # Print summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\n{'='*60}")
    print(f"Results: {passed}/{total} tests passed")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║   Optometry Purchase Predictor V2.0 - Backend Tests     ║
╚══════════════════════════════════════════════════════════╝

Before running tests, make sure:
1. Backend server is running (uvicorn app.main:app --reload)
2. Database is initialized
3. ML models are trained

""")

    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")