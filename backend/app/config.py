"""
config.py - Centralized configuration management.
Loads settings from environment variables with validation.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All sensitive values should be set via environment variables in production.
    """
    
    # === Application ===
    app_name: str = "KLH Team-Project Matching Platform"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"  # development, staging, production
    
    # === Server ===
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # === Database ===
    database_url: str = "sqlite:///./klh.db"
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_echo: bool = False
    
    # === Security ===
    secret_key: str = "klh_super_secret_key_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    
    # === CORS ===
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # === Rate Limiting ===
    rate_limit_enabled: bool = True
    rate_limit_default: int = 100  # requests per minute
    rate_limit_auth: int = 10  # login attempts per minute
    rate_limit_upload: int = 5  # uploads per minute
    
    # === Caching ===
    cache_enabled: bool = True
    cache_ttl_default: int = 300  # seconds
    cache_max_size: int = 1000
    
    # === Logging ===
    log_level: str = "INFO"
    log_format: str = "json"  # json or text
    log_file: Optional[str] = None
    
    # === AI/Embeddings ===
    embedding_model: str = "all-MiniLM-L6-v2"
    faiss_index_path: str = "faiss_employee.index"
    faiss_project_index_path: str = "faiss_project.index"
    
    # === File Upload ===
    max_upload_size: int = 10 * 1024 * 1024  # 10 MB
    allowed_upload_types: List[str] = [".pdf"]
    
    # === Feature Flags ===
    enable_signup: bool = True
    enable_resume_parsing: bool = True
    enable_team_matching: bool = True
    
    # === Google OAuth ===
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:5174/auth/google/callback"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v, info):
        if info.data.get("environment") == "production" and v == "klh_super_secret_key_change_in_production":
            raise ValueError("Must set a secure SECRET_KEY in production!")
        return v
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
        "protected_namespaces": ("settings_",)
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Return cached settings instance.
    Use this function to get settings throughout the application.
    """
    return Settings()


# Convenience alias
settings = get_settings()
