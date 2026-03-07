"""
rate_limiter.py - Token bucket rate limiting middleware.
Protects against brute force and DDoS attacks.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import asyncio


@dataclass
class TokenBucket:
    """Token bucket implementation for rate limiting."""
    capacity: int
    refill_rate: float  # tokens per second
    tokens: float = field(default=0)
    last_refill: float = field(default_factory=time.time)
    
    def __post_init__(self):
        self.tokens = self.capacity
    
    def consume(self, tokens: int = 1) -> bool:
        """Attempt to consume tokens. Returns True if successful."""
        now = time.time()
        # Refill tokens based on time elapsed
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False
    
    def time_until_available(self, tokens: int = 1) -> float:
        """Calculate seconds until tokens are available."""
        if self.tokens >= tokens:
            return 0
        needed = tokens - self.tokens
        return needed / self.refill_rate


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with different limits per endpoint type.
    Uses IP-based rate limiting with configurable limits.
    """
    
    def __init__(
        self,
        app,
        default_rate: int = 100,  # requests per minute
        default_burst: int = 20,   # burst capacity
        auth_rate: int = 10,       # login attempts per minute
        auth_burst: int = 5,
        upload_rate: int = 5,      # uploads per minute
        upload_burst: int = 2,
        cleanup_interval: int = 300,  # cleanup old buckets every 5 minutes
    ):
        super().__init__(app)
        self.default_rate = default_rate
        self.default_burst = default_burst
        self.auth_rate = auth_rate
        self.auth_burst = auth_burst
        self.upload_rate = upload_rate
        self.upload_burst = upload_burst
        self.cleanup_interval = cleanup_interval
        
        # Separate buckets for different endpoint types
        self.buckets: Dict[str, Dict[str, TokenBucket]] = {
            "default": defaultdict(lambda: TokenBucket(default_burst, default_rate / 60)),
            "auth": defaultdict(lambda: TokenBucket(auth_burst, auth_rate / 60)),
            "upload": defaultdict(lambda: TokenBucket(upload_burst, upload_rate / 60)),
        }
        self.last_cleanup = time.time()
        self._lock = asyncio.Lock()
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies."""
        # Check for forwarded IP (behind proxy/load balancer)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _get_bucket_type(self, path: str, method: str) -> str:
        """Determine rate limit bucket based on endpoint."""
        path_lower = path.lower()
        
        # Auth endpoints (stricter limits)
        if any(x in path_lower for x in ["/login", "/signup", "/register"]):
            return "auth"
        
        # Upload endpoints
        if "/upload" in path_lower or method == "POST" and "/resume" in path_lower:
            return "upload"
        
        return "default"
    
    async def _cleanup_old_buckets(self):
        """Remove stale buckets to prevent memory growth."""
        async with self._lock:
            now = time.time()
            if now - self.last_cleanup < self.cleanup_interval:
                return
            
            for bucket_type in self.buckets:
                stale_keys = [
                    key for key, bucket in self.buckets[bucket_type].items()
                    if now - bucket.last_refill > 600  # 10 minutes of inactivity
                ]
                for key in stale_keys:
                    del self.buckets[bucket_type][key]
            
            self.last_cleanup = now
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        bucket_type = self._get_bucket_type(request.url.path, request.method)
        
        bucket = self.buckets[bucket_type][client_ip]
        
        if not bucket.consume():
            retry_after = int(bucket.time_until_available() + 1)
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )
        
        # Periodic cleanup
        await self._cleanup_old_buckets()
        
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(bucket.capacity)
        response.headers["X-RateLimit-Remaining"] = str(int(bucket.tokens))
        
        return response
