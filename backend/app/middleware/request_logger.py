"""
request_logger.py - Structured request/response logging middleware.
Provides detailed logging for debugging and audit trails.
"""

import time
import uuid
import logging
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import json

# Configure structured logger
logger = logging.getLogger("klh.requests")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Logs all requests with timing, status codes, and contextual info.
    Supports JSON structured logging for log aggregation systems.
    """
    
    def __init__(
        self,
        app,
        log_request_body: bool = False,
        log_response_body: bool = False,
        excluded_paths: Optional[list] = None,
        sensitive_headers: Optional[list] = None,
    ):
        super().__init__(app)
        self.log_request_body = log_request_body
        self.log_response_body = log_response_body
        self.excluded_paths = excluded_paths or ["/health", "/docs", "/openapi.json"]
        self.sensitive_headers = sensitive_headers or ["authorization", "cookie", "x-api-key"]
    
    def _sanitize_headers(self, headers: dict) -> dict:
        """Remove sensitive headers from logs."""
        return {
            k: "***REDACTED***" if k.lower() in self.sensitive_headers else v
            for k, v in headers.items()
        }
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, handling proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    async def dispatch(self, request: Request, call_next):
        # Skip logging for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)
        
        # Generate unique request ID for tracing
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        start_time = time.perf_counter()
        
        # Capture request info
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params) if request.query_params else None,
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent", "unknown")[:100],
        }
        
        # Optionally log request headers (sanitized)
        if logger.isEnabledFor(logging.DEBUG):
            log_data["headers"] = self._sanitize_headers(dict(request.headers))
        
        response: Optional[Response] = None
        error: Optional[Exception] = None
        
        try:
            response = await call_next(request)
        except Exception as e:
            error = e
            raise
        finally:
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            log_data["duration_ms"] = round(duration_ms, 2)
            log_data["status_code"] = response.status_code if response else 500
            
            if error:
                log_data["error"] = str(error)[:200]
            
            # Log level based on status code and duration
            if error or (response and response.status_code >= 500):
                logger.error(json.dumps(log_data))
            elif response and response.status_code >= 400:
                logger.warning(json.dumps(log_data))
            elif duration_ms > 1000:  # Slow request warning
                logger.warning(f"SLOW_REQUEST: {json.dumps(log_data)}")
            else:
                logger.info(json.dumps(log_data))
        
        # Add request ID header for debugging
        if response:
            response.headers["X-Request-ID"] = request_id
        
        return response
