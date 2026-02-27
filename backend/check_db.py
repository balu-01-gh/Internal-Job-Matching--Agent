import sys
sys.path.insert(0, 'd:/KLH/backend')

from app.database import SessionLocal
from app import models

db = SessionLocal()
emps = db.query(models.Employee).all()
print(f'Total: {len(emps)} employees')
for e in emps:
    print(f'  {e.role:<10} {e.email:<26} resume={e.resume_uploaded}')
db.close()
