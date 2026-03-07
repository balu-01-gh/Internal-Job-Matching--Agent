"""
exceptions.py - Custom exception classes with structured error responses.
Provides consistent error handling across the API.
"""

from typing import Any, Dict, Optional, List
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger("klh.errors")


class KLHBaseException(Exception):
    """Base exception for all KLH platform errors."""
    
    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to API response format."""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details,
            }
        }


# === Authentication & Authorization Errors ===

class AuthenticationError(KLHBaseException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication required", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=401,
            details=details,
        )


class AuthorizationError(KLHBaseException):
    """Raised when user lacks permission for an action."""
    
    def __init__(self, message: str = "Permission denied", required_role: Optional[str] = None):
        details = {"required_role": required_role} if required_role else {}
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=403,
            details=details,
        )


class InvalidCredentialsError(AuthenticationError):
    """Raised for invalid login credentials."""
    
    def __init__(self):
        super().__init__(
            message="Invalid email or password",
            details={"hint": "Check your credentials and try again"},
        )


class TokenExpiredError(AuthenticationError):
    """Raised when JWT token has expired."""
    
    def __init__(self):
        super().__init__(
            message="Your session has expired",
            details={"action": "Please log in again"},
        )


# === Resource Errors ===

class ResourceNotFoundError(KLHBaseException):
    """Raised when a requested resource doesn't exist."""
    
    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            message=f"{resource_type} not found",
            error_code="RESOURCE_NOT_FOUND",
            status_code=404,
            details={"resource_type": resource_type, "resource_id": str(resource_id)},
        )


class ResourceExistsError(KLHBaseException):
    """Raised when trying to create a duplicate resource."""
    
    def __init__(self, resource_type: str, field: str, value: Any):
        super().__init__(
            message=f"{resource_type} with {field}='{value}' already exists",
            error_code="RESOURCE_EXISTS",
            status_code=409,
            details={"resource_type": resource_type, "field": field, "value": str(value)},
        )


# === Validation Errors ===

class ValidationError(KLHBaseException):
    """Raised for business logic validation failures."""
    
    def __init__(self, message: str, field: Optional[str] = None, errors: Optional[List[Dict]] = None):
        details = {}
        if field:
            details["field"] = field
        if errors:
            details["errors"] = errors
        
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class InvalidFileError(ValidationError):
    """Raised for invalid file uploads."""
    
    def __init__(self, message: str = "Invalid file", allowed_types: Optional[List[str]] = None):
        super().__init__(
            message=message,
            field="file",
            errors=[{"allowed_types": allowed_types}] if allowed_types else None,
        )


# === Business Logic Errors ===

class TeamCapacityError(KLHBaseException):
    """Raised when team capacity limits are exceeded."""
    
    def __init__(self, team_id: int, max_capacity: int):
        super().__init__(
            message="Team has reached maximum capacity",
            error_code="TEAM_CAPACITY_EXCEEDED",
            status_code=400,
            details={"team_id": team_id, "max_capacity": max_capacity},
        )


class AlreadyMemberError(KLHBaseException):
    """Raised when user is already a team member."""
    
    def __init__(self, team_name: str):
        super().__init__(
            message=f"You are already a member of team '{team_name}'",
            error_code="ALREADY_MEMBER",
            status_code=400,
        )


class EmbeddingError(KLHBaseException):
    """Raised when embedding generation fails."""
    
    def __init__(self, message: str = "Failed to generate embedding"):
        super().__init__(
            message=message,
            error_code="EMBEDDING_ERROR",
            status_code=500,
        )


class RateLimitError(KLHBaseException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, retry_after: int = 60):
        super().__init__(
            message="Too many requests. Please slow down.",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details={"retry_after": retry_after},
        )


# === Exception Handlers ===

async def klh_exception_handler(request: Request, exc: KLHBaseException) -> JSONResponse:
    """Handle all KLH custom exceptions."""
    logger.warning(f"KLH Exception: {exc.error_code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions with consistent format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "details": {},
            }
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors with detailed field info."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"errors": errors},
            }
        },
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
            }
        },
    )


def setup_exception_handlers(app):
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(KLHBaseException, klh_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
