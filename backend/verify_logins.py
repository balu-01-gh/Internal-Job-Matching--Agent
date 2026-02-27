"""Quick login verification for all HR and team_lead accounts."""
import sys
sys.path.insert(0, 'd:/KLH/backend')

import bcrypt as _bcrypt
from app.database import SessionLocal
from app import models

db = SessionLocal()
accounts = db.query(models.Employee).filter(
    models.Employee.role.in_(['hr', 'team_lead'])
).all()

print(f"Checking {len(accounts)} HR/team_lead accounts:\n")
for emp in accounts:
    ok = _bcrypt.checkpw(b'pass123', emp.password_hash.encode())
    ok_hr = _bcrypt.checkpw(b'hr123', emp.password_hash.encode())
    pwd_status = "pass123=OK" if ok else ("hr123=OK" if ok_hr else "UNKNOWN_PWD")
    print(f"  {emp.role:<10} {emp.email:<26} {pwd_status}  resume={emp.resume_uploaded}")

db.close()
