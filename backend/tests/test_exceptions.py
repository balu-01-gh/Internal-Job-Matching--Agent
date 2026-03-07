"""
Unit tests for custom exception classes.
"""

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app.exceptions import (
    KLHBaseException,
    AuthenticationError,
    AuthorizationError,
    InvalidCredentialsError,
    ResourceNotFoundError,
    ResourceExistsError,
    ValidationError,
    TeamCapacityError,
)


class TestKLHBaseException:
    """Tests for base exception class."""
    
    @pytest.mark.unit
    def test_basic_exception(self):
        exc = KLHBaseException(
            message="Test error",
            error_code="TEST_ERROR",
            status_code=400,
        )
        
        assert exc.message == "Test error"
        assert exc.error_code == "TEST_ERROR"
        assert exc.status_code == 400
    
    @pytest.mark.unit
    def test_to_dict(self):
        exc = KLHBaseException(
            message="Test error",
            error_code="TEST_ERROR",
            status_code=400,
            details={"field": "value"},
        )
        
        result = exc.to_dict()
        
        assert result["error"]["code"] == "TEST_ERROR"
        assert result["error"]["message"] == "Test error"
        assert result["error"]["details"]["field"] == "value"


class TestAuthenticationErrors:
    """Tests for authentication-related exceptions."""
    
    @pytest.mark.unit
    def test_authentication_error_defaults(self):
        exc = AuthenticationError()
        
        assert exc.status_code == 401
        assert exc.error_code == "AUTHENTICATION_ERROR"
        assert "Authentication required" in exc.message
    
    @pytest.mark.unit
    def test_invalid_credentials_error(self):
        exc = InvalidCredentialsError()
        
        assert exc.status_code == 401
        assert "Invalid email or password" in exc.message
    
    @pytest.mark.unit
    def test_authorization_error_with_role(self):
        exc = AuthorizationError(
            message="Admin access required",
            required_role="admin",
        )
        
        assert exc.status_code == 403
        assert exc.details["required_role"] == "admin"


class TestResourceErrors:
    """Tests for resource-related exceptions."""
    
    @pytest.mark.unit
    def test_resource_not_found(self):
        exc = ResourceNotFoundError("Team", 123)
        
        assert exc.status_code == 404
        assert "Team not found" in exc.message
        assert exc.details["resource_type"] == "Team"
        assert exc.details["resource_id"] == "123"
    
    @pytest.mark.unit
    def test_resource_exists(self):
        exc = ResourceExistsError("Employee", "email", "test@example.com")
        
        assert exc.status_code == 409
        assert "already exists" in exc.message
        assert exc.details["field"] == "email"


class TestValidationErrors:
    """Tests for validation-related exceptions."""
    
    @pytest.mark.unit
    def test_validation_error_basic(self):
        exc = ValidationError("Invalid input")
        
        assert exc.status_code == 422
        assert exc.error_code == "VALIDATION_ERROR"
    
    @pytest.mark.unit
    def test_validation_error_with_field(self):
        exc = ValidationError("Email is invalid", field="email")
        
        assert exc.details["field"] == "email"
    
    @pytest.mark.unit
    def test_team_capacity_error(self):
        exc = TeamCapacityError(team_id=1, max_capacity=10)
        
        assert exc.status_code == 400
        assert exc.details["team_id"] == 1
        assert exc.details["max_capacity"] == 10
