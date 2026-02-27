"""Remove test accounts created during debugging."""
import sys
sys.path.insert(0, 'd:/KLH/backend')

from app.database import SessionLocal
from app import models

TEST_EMAILS = ['testlead999@klh.com', 'subbu@klh.com', 'balaji@klh.com']

db = SessionLocal()
# Also delete the test team if created
test_team = db.query(models.Team).filter(models.Team.team_code == 'TEST77').first()

for email in TEST_EMAILS:
    emp = db.query(models.Employee).filter(models.Employee.email == email).first()
    if emp:
        print(f'Deleting {email} ...')
        # If this employee is a team lead, nullify Team.team_lead_id first
        team_ref = db.query(models.Team).filter(models.Team.team_lead_id == emp.id).first()
        if team_ref:
            team_ref.team_lead_id = None
        # If the employee belongs to a team, set team_id to None
        db.delete(emp)

if test_team:
    print(f'Deleting team TEST77 ...')
    db.delete(test_team)

db.commit()
db.close()
print('Done. Remaining employees:')

db2 = SessionLocal()
for e in db2.query(models.Employee).all():
    print(f'  {e.role:<10} {e.email}')
db2.close()
