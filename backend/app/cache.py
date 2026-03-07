"""
cache.py - In-memory caching with TTL support.
Can be swapped for Redis in production.
"""

import time
import asyncio
from typing import Any, Optional, Callable, TypeVar, Dict
from functools import wraps
from dataclasses import dataclass, field
import hashlib
import json

T = TypeVar("T")


@dataclass
class CacheEntry:
    """Single cache entry with TTL tracking."""
    value: Any
    expires_at: float
    created_at: float = field(default_factory=time.time)
    hit_count: int = 0


class TTLCache:
    """
    Thread-safe in-memory cache with TTL support.
    Features:
    - Automatic expiration
    - LRU eviction when max size reached
    - Cache statistics
    """
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()
        self._stats = {"hits": 0, "misses": 0, "evictions": 0}
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache. Returns None if expired or not found."""
        async with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                self._stats["misses"] += 1
                return None
            
            if time.time() > entry.expires_at:
                del self._cache[key]
                self._stats["misses"] += 1
                return None
            
            entry.hit_count += 1
            self._stats["hits"] += 1
            return entry.value
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with optional TTL override."""
        async with self._lock:
            # Evict oldest entries if max size reached
            while len(self._cache) >= self.max_size:
                oldest_key = min(
                    self._cache.keys(),
                    key=lambda k: self._cache[k].created_at,
                )
                del self._cache[oldest_key]
                self._stats["evictions"] += 1
            
            self._cache[key] = CacheEntry(
                value=value,
                expires_at=time.time() + (self.default_ttl if ttl is None else ttl),
            )
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache. Returns True if key existed."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    async def clear(self) -> int:
        """Clear all cache entries. Returns count of cleared entries."""
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count
    
    async def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        async with self._lock:
            now = time.time()
            expired = [k for k, v in self._cache.items() if now > v.expires_at]
            for key in expired:
                del self._cache[key]
            return len(expired)
    
    def stats(self) -> dict:
        """Get cache statistics."""
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
        return {
            **self._stats,
            "size": len(self._cache),
            "hit_rate": round(hit_rate, 2),
        }


# Global cache instance
cache = TTLCache(max_size=1000, default_ttl=300)


def cache_key(*args, **kwargs) -> str:
    """Generate a deterministic cache key from arguments."""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator for caching async function results.
    
    Usage:
        @cached(ttl=60, key_prefix="teams")
        async def get_teams(db):
            return await fetch_teams(db)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{key_prefix}:{func.__name__}:{cache_key(*args[1:], **kwargs)}"
            
            # Try cache first
            cached_value = await cache.get(key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            await cache.set(key, result, ttl)
            
            return result
        
        # Add cache clear helper
        wrapper.clear_cache = lambda: cache.delete(f"{key_prefix}:{func.__name__}:*")
        
        return wrapper
    return decorator


def invalidate_cache(*prefixes: str):
    """
    Decorator to invalidate cache entries after function execution.
    
    Usage:
        @invalidate_cache("teams", "projects")
        async def update_team(db, team_id, data):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # Invalidate matching cache entries
            async with cache._lock:
                to_delete = [
                    k for k in cache._cache.keys()
                    if any(k.startswith(p) for p in prefixes)
                ]
                for key in to_delete:
                    del cache._cache[key]
            
            return result
        return wrapper
    return decorator
