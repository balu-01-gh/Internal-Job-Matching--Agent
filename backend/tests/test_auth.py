"""
Unit tests for authentication module.
"""

import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    SECRET_KEY,
    ALGORITHM,
)


class TestPasswordHashing:
    """Tests for password hashing functions."""
    
    @pytest.mark.unit
    def test_hash_password_returns_different_from_plain(self):
        plain = "mysecretpassword"
        hashed = hash_password(plain)
        assert hashed != plain
        assert len(hashed) > 20  # bcrypt hashes are typically 60 chars
    
    @pytest.mark.unit
    def test_hash_password_produces_unique_hashes(self):
        """Same password should produce different hashes (due to salt)."""
        plain = "samepassword"
        hash1 = hash_password(plain)
        hash2 = hash_password(plain)
        assert hash1 != hash2
    
    @pytest.mark.unit
    def test_verify_password_correct(self):
        plain = "verifytest123"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True
    
    @pytest.mark.unit
    def test_verify_password_incorrect(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False
    
    @pytest.mark.unit
    def test_verify_password_empty_string(self):
        hashed = hash_password("password123")
        assert verify_password("", hashed) is False


class TestTokenCreation:
    """Tests for JWT token creation."""
    
    @pytest.mark.unit
    def test_create_access_token_basic(self):
        data = {"sub": "test@example.com", "role": "employee"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 50
    
    @pytest.mark.unit
    def test_create_access_token_contains_data(self):
        data = {"sub": "user@test.com", "role": "hr", "custom": "value"}
        token = create_access_token(data)
        
        # Decode without verification to check payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert payload["sub"] == "user@test.com"
        assert payload["role"] == "hr"
        assert payload["custom"] == "value"
    
    @pytest.mark.unit
    def test_create_access_token_has_expiry(self):
        token = create_access_token({"sub": "test@example.com"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert "exp" in payload
        # Expiry should be in the future
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp > datetime.now(timezone.utc)
    
    @pytest.mark.unit
    def test_create_access_token_custom_expiry(self):
        custom_delta = timedelta(minutes=5)
        token = create_access_token({"sub": "test@example.com"}, expires_delta=custom_delta)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        
        # Should expire within ~5-6 minutes
        diff = (exp - now).total_seconds()
        assert 4 * 60 < diff < 6 * 60


class TestTokenDecoding:
    """Tests for JWT token decoding."""
    
    @pytest.mark.unit
    def test_decode_valid_token(self):
        original_data = {"sub": "test@example.com", "role": "employee"}
        token = create_access_token(original_data)
        
        payload = decode_token(token)
        
        assert payload["sub"] == "test@example.com"
        assert payload["role"] == "employee"
    
    @pytest.mark.unit
    def test_decode_invalid_token_raises(self):
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.unit
    def test_decode_expired_token_raises(self):
        from fastapi import HTTPException
        
        # Create token that expired in the past
        expired_delta = timedelta(seconds=-10)
        token = create_access_token({"sub": "test@example.com"}, expires_delta=expired_delta)
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.unit
    def test_decode_token_missing_sub_raises(self):
        from fastapi import HTTPException
        
        # Create token without 'sub' claim
        token = jwt.encode(
            {"role": "employee", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        
        assert exc_info.value.status_code == 401
