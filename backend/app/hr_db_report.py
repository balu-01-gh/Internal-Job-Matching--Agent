import os
from app.admin_tools import list_hr_dbs, get_hr_db_size

def print_hr_db_report():
    print("HR DB Report:")
    for db in list_hr_dbs():
        hr_id = db.split('_')[1].split('.')[0]
        size = get_hr_db_size(hr_id)
        print(f"  {db}: {size/1024:.2f} KB")

if __name__ == "__main__":
    print_hr_db_report()
