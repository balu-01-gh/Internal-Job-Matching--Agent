"""
supabase_client.py - Supabase integration for real-time features
Provides real-time subscriptions, storage, and database operations
"""

import os
from typing import Optional, Any, Dict, List
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Check if Supabase is configured
SUPABASE_ENABLED = bool(SUPABASE_URL and SUPABASE_ANON_KEY)


class SupabaseClient:
    """
    Wrapper for Supabase operations.
    Provides methods for real-time, storage, and database operations.
    """
    
    def __init__(self, use_service_key: bool = False):
        """
        Initialize Supabase client.
        
        Args:
            use_service_key: If True, use service key for admin operations
        """
        self.url = SUPABASE_URL
        self.key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
        self._client = None
        
        if SUPABASE_ENABLED:
            try:
                from supabase import create_client, Client
                self._client: Client = create_client(self.url, self.key)
            except ImportError:
                print("Warning: supabase-py not installed. Run: pip install supabase")
            except Exception as e:
                print(f"Warning: Failed to initialize Supabase client: {e}")
    
    @property
    def is_enabled(self) -> bool:
        """Check if Supabase is properly configured and available."""
        return self._client is not None
    
    # ── Database Operations ───────────────────────────────────────────────────
    
    def table(self, table_name: str):
        """
        Access a Supabase table for queries.
        
        Usage:
            client.table("notifications").select("*").eq("user_id", 1).execute()
        """
        if not self.is_enabled:
            raise RuntimeError("Supabase client not available")
        return self._client.table(table_name)
    
    async def insert(self, table_name: str, data: Dict[str, Any]) -> Dict:
        """Insert a record into a table."""
        if not self.is_enabled:
            return {"error": "Supabase not configured"}
        
        result = self._client.table(table_name).insert(data).execute()
        return {"data": result.data, "count": result.count}
    
    async def select(
        self, 
        table_name: str, 
        columns: str = "*",
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """Select records from a table."""
        if not self.is_enabled:
            return []
        
        query = self._client.table(table_name).select(columns)
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        return result.data
    
    async def update(
        self, 
        table_name: str, 
        data: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> Dict:
        """Update records in a table."""
        if not self.is_enabled:
            return {"error": "Supabase not configured"}
        
        query = self._client.table(table_name).update(data)
        
        for key, value in filters.items():
            query = query.eq(key, value)
        
        result = query.execute()
        return {"data": result.data, "count": result.count}
    
    async def delete(self, table_name: str, filters: Dict[str, Any]) -> Dict:
        """Delete records from a table."""
        if not self.is_enabled:
            return {"error": "Supabase not configured"}
        
        query = self._client.table(table_name).delete()
        
        for key, value in filters.items():
            query = query.eq(key, value)
        
        result = query.execute()
        return {"data": result.data, "count": result.count}
    
    # ── Real-time Operations ──────────────────────────────────────────────────
    
    def subscribe(
        self, 
        table_name: str, 
        callback: callable,
        event: str = "*",  # INSERT, UPDATE, DELETE, or *
        filter_column: Optional[str] = None,
        filter_value: Optional[Any] = None
    ):
        """
        Subscribe to real-time changes on a table.
        
        Args:
            table_name: Name of the table to subscribe to
            callback: Function to call when changes occur
            event: Type of event to listen for
            filter_column: Column to filter on (optional)
            filter_value: Value to filter for (optional)
        
        Returns:
            Subscription object (call .unsubscribe() to stop)
        """
        if not self.is_enabled:
            print("Warning: Supabase not configured, real-time disabled")
            return None
        
        channel = self._client.channel(f"realtime:{table_name}")
        
        # Build filter string if provided
        filter_str = None
        if filter_column and filter_value is not None:
            filter_str = f"{filter_column}=eq.{filter_value}"
        
        channel.on_postgres_changes(
            event=event,
            schema="public",
            table=table_name,
            filter=filter_str,
            callback=callback
        )
        
        channel.subscribe()
        return channel
    
    def broadcast(self, channel_name: str, event: str, payload: Dict[str, Any]):
        """
        Broadcast a message to all subscribers of a channel.
        Useful for custom real-time events (not database-backed).
        """
        if not self.is_enabled:
            return
        
        channel = self._client.channel(channel_name)
        channel.subscribe()
        channel.send_broadcast(event, payload)
    
    # ── Storage Operations ────────────────────────────────────────────────────
    
    def storage(self, bucket_name: str = "uploads"):
        """
        Access Supabase Storage bucket.
        
        Usage:
            client.storage("avatars").upload("user1.png", file_data)
        """
        if not self.is_enabled:
            raise RuntimeError("Supabase client not available")
        return self._client.storage.from_(bucket_name)
    
    async def upload_file(
        self, 
        bucket: str, 
        path: str, 
        file_data: bytes,
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """
        Upload a file to Supabase Storage.
        
        Returns:
            Public URL of the uploaded file, or None on failure
        """
        if not self.is_enabled:
            return None
        
        try:
            self._client.storage.from_(bucket).upload(
                path=path,
                file=file_data,
                file_options={"content-type": content_type}
            )
            
            # Get public URL
            url = self._client.storage.from_(bucket).get_public_url(path)
            return url
        except Exception as e:
            print(f"Upload failed: {e}")
            return None
    
    async def delete_file(self, bucket: str, paths: List[str]) -> bool:
        """Delete files from Supabase Storage."""
        if not self.is_enabled:
            return False
        
        try:
            self._client.storage.from_(bucket).remove(paths)
            return True
        except Exception as e:
            print(f"Delete failed: {e}")
            return False
    
    # ── Auth Operations (Supabase Auth) ───────────────────────────────────────
    
    async def sign_up(self, email: str, password: str) -> Dict:
        """Sign up a new user with Supabase Auth."""
        if not self.is_enabled:
            return {"error": "Supabase not configured"}
        
        result = self._client.auth.sign_up({
            "email": email,
            "password": password
        })
        return {"user": result.user, "session": result.session}
    
    async def sign_in(self, email: str, password: str) -> Dict:
        """Sign in a user with Supabase Auth."""
        if not self.is_enabled:
            return {"error": "Supabase not configured"}
        
        result = self._client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return {"user": result.user, "session": result.session}
    
    async def sign_out(self) -> bool:
        """Sign out the current user."""
        if not self.is_enabled:
            return False
        
        self._client.auth.sign_out()
        return True
    
    def get_user(self):
        """Get the current authenticated user."""
        if not self.is_enabled:
            return None
        return self._client.auth.get_user()


# ── Singleton Instance ────────────────────────────────────────────────────────

@lru_cache()
def get_supabase() -> SupabaseClient:
    """Get the shared Supabase client instance."""
    return SupabaseClient()


@lru_cache()
def get_supabase_admin() -> SupabaseClient:
    """Get Supabase client with service key for admin operations."""
    return SupabaseClient(use_service_key=True)


# ── FastAPI Dependency ────────────────────────────────────────────────────────

def supabase_client() -> SupabaseClient:
    """FastAPI dependency to inject Supabase client."""
    return get_supabase()
