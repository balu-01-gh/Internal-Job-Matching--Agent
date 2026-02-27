"""
admin_tools.py - Utilities for HR DB management.
"""
import os
import shutil

HR_DB_DIR = os.path.dirname(os.path.abspath(__file__))


def list_hr_dbs():
    """List all HR database files."""
    return [f for f in os.listdir(HR_DB_DIR) if f.startswith("hr_") and f.endswith(".db")]


def backup_hr_db(hr_id, backup_dir):
    """Backup a specific HR DB to the given directory."""
    db_path = os.path.join(HR_DB_DIR, f"hr_{hr_id}.db")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"No DB for HR ID {hr_id}")
    os.makedirs(backup_dir, exist_ok=True)
    backup_path = os.path.join(backup_dir, f"hr_{hr_id}.db.bak")
    shutil.copy2(db_path, backup_path)
    return backup_path


def delete_hr_db(hr_id):
    """Delete a specific HR DB."""
    db_path = os.path.join(HR_DB_DIR, f"hr_{hr_id}.db")
    if os.path.exists(db_path):
        os.remove(db_path)
        return True
    return False


def get_hr_db_size(hr_id):
    """Get the size of a specific HR DB in bytes."""
    db_path = os.path.join(HR_DB_DIR, f"hr_{hr_id}.db")
    if os.path.exists(db_path):
        return os.path.getsize(db_path)
    return 0

if __name__ == "__main__":
    print("All HR DBs:", list_hr_dbs())
