import requests

BASE_URL = "http://localhost:8000"
session = requests.Session()

login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
    "email": "admin@company.com",
    "password": "admin1234"
})
print("Login status:", login_resp.status_code, login_resp.json())

query = "leave policy"
search_resp = session.post(f"{BASE_URL}/api/search", json={"query": query, "limit": 10})
print("\nSearch status:", search_resp.status_code)
print("Raw response:", search_resp.text)
