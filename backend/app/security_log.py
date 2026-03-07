import logging
import os

LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'security.log')
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

def log_failed_login(email, reason):
    logging.warning(f"Failed login for {email}: {reason}")

def log_suspicious_access(user, detail):
    logging.warning(f"Suspicious access by {user}: {detail}")
