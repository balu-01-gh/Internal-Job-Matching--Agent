"""
Unit tests for caching module.
"""

import pytest
import asyncio
from app.cache import TTLCache, cache_key


class TestTTLCache:
    """Tests for TTL cache implementation."""
    
    @pytest.fixture
    def cache_instance(self):
        return TTLCache(max_size=10, default_ttl=60)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_set_and_get(self, cache_instance):
        await cache_instance.set("key1", "value1")
        result = await cache_instance.get("key1")
        
        assert result == "value1"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_nonexistent_key(self, cache_instance):
        result = await cache_instance.get("nonexistent")
        
        assert result is None
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_key(self, cache_instance):
        await cache_instance.set("key1", "value1")
        deleted = await cache_instance.delete("key1")
        
        assert deleted is True
        assert await cache_instance.get("key1") is None
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_nonexistent_key(self, cache_instance):
        deleted = await cache_instance.delete("nonexistent")
        
        assert deleted is False
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_clear_cache(self, cache_instance):
        await cache_instance.set("key1", "value1")
        await cache_instance.set("key2", "value2")
        
        count = await cache_instance.clear()
        
        assert count == 2
        assert await cache_instance.get("key1") is None
        assert await cache_instance.get("key2") is None
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_ttl_expiration(self, cache_instance):
        # Set with very short TTL
        await cache_instance.set("expiring", "value", ttl=0)
        
        # Wait briefly then check
        await asyncio.sleep(0.1)
        result = await cache_instance.get("expiring")
        
        assert result is None
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_max_size_eviction(self, cache_instance):
        # Fill cache to max
        for i in range(15):
            await cache_instance.set(f"key{i}", f"value{i}")
        
        # Should have evicted oldest entries
        stats = cache_instance.stats()
        assert stats["size"] <= 10
        assert stats["evictions"] > 0
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_cache_stats(self, cache_instance):
        await cache_instance.set("key1", "value1")
        await cache_instance.get("key1")  # Hit
        await cache_instance.get("key1")  # Hit
        await cache_instance.get("missing")  # Miss
        
        stats = cache_instance.stats()
        
        assert stats["hits"] == 2
        assert stats["misses"] == 1
        assert stats["size"] == 1


class TestCacheKey:
    """Tests for cache key generation."""
    
    @pytest.mark.unit
    def test_same_args_same_key(self):
        key1 = cache_key("arg1", "arg2", kwarg="value")
        key2 = cache_key("arg1", "arg2", kwarg="value")
        
        assert key1 == key2
    
    @pytest.mark.unit
    def test_different_args_different_key(self):
        key1 = cache_key("arg1", "arg2")
        key2 = cache_key("arg1", "arg3")
        
        assert key1 != key2
    
    @pytest.mark.unit
    def test_kwargs_order_independent(self):
        key1 = cache_key(a=1, b=2, c=3)
        key2 = cache_key(c=3, a=1, b=2)
        
        assert key1 == key2
