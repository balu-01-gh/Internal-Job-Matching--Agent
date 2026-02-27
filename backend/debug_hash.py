import bcrypt as _bcrypt
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///d:/KLH/backend/klh.db")
with engine.connect() as conn:
    row = conn.execute(
        text("SELECT email, password_hash FROM employees WHERE email='testlead999@klh.com'")
    ).fetchone()
    if row:
        print("email:", row[0])
        print("hash:", row[1])
        print("hash len:", len(row[1]))
        print("repr:", repr(row[1][:60]))
        for pwd in ["MyTest99", "MyTest@99", "pass123", "testlead999"]:
            try:
                ok = _bcrypt.checkpw(pwd.encode(), row[1].encode())
                print(f"  checkpw({pwd!r}) = {ok}")
            except Exception as e:
                print(f"  checkpw({pwd!r}) ERROR: {e}")

        # Also test hash/verify right now
        print("\n--- Live hash/verify test ---")
        test_plain = "MyTest99"
        fresh_hash = _bcrypt.hashpw(test_plain.encode(), _bcrypt.gensalt()).decode()
        print("fresh hash:", fresh_hash[:30], "...")
        print("verify fresh:", _bcrypt.checkpw(test_plain.encode(), fresh_hash.encode()))

        # Check if there's a hidden char in stored hash
        stored = row[1]
        print("\nstored bytes:", stored.encode()[:30])
    else:
        print("NOT FOUND")
