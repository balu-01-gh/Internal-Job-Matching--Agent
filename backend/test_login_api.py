"""Test login API for all roles."""
import requests

tests = [
    ("hr@klh.com", "hr123", "hr"),
    ("arjun@klh.com", "pass123", "team_lead"),
    ("sameer@klh.com", "pass123", "team_lead"),
    ("meera@klh.com", "pass123", "employee"),
]

for email, pwd, expected_role in tests:
    r = requests.post("http://localhost:8000/api/employee/login",
                      json={"email": email, "password": pwd})
    if r.ok:
        token = r.json()["access_token"]
        me = requests.get("http://localhost:8000/api/employee/me",
                          headers={"Authorization": f"Bearer {token}"})
        user = me.json()
        status = "OK" if user["role"] == expected_role else f"ROLE_MISMATCH({user['role']})"
        print(f"  {email:<26} {status}  resume={user.get('resume_uploaded')}")
    else:
        print(f"  {email:<26} FAIL {r.status_code} {r.json()}")
