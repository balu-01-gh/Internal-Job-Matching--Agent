"""
google_auth.py - Google OAuth2 authentication for KLH Match
Handles Google sign-in verification and user creation/linking
"""

import os
from typing import Optional
from datetime import timedelta

import httpx
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db, get_hr_db
from app import models
from app.auth import create_access_token, hash_password, ACCESS_TOKEN_EXPIRE_MINUTES

from app.config import settings
GOOGLE_CLIENT_ID = settings.google_client_id
GOOGLE_CLIENT_SECRET = settings.google_client_secret
GOOGLE_REDIRECT_URI = settings.google_redirect_uri

# Google OAuth endpoints
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"

router = APIRouter(prefix="/api/auth/google", tags=["Google Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    """Request with Google authorization code or ID token"""
    code: Optional[str] = None  # Authorization code from OAuth flow
    id_token: Optional[str] = None  # ID token from Google Sign-In button
    hr_id: str  # Required HR ID for multi-tenant


class GoogleAuthResponse(BaseModel):
    """Response after successful Google authentication"""
    access_token: str
    token_type: str = "bearer"
    user: dict


class GoogleUserInfo(BaseModel):
    """Data extracted from Google user info"""
    email: EmailStr
    name: str
    picture: Optional[str] = None
    google_id: str
    email_verified: bool = False


# ── Helper Functions ──────────────────────────────────────────────────────────

async def verify_google_id_token(id_token: str) -> GoogleUserInfo:
    """
    Verify a Google ID token and extract user info.
    Used when user signs in with Google Sign-In button.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_TOKEN_INFO_URL,
            params={"id_token": id_token}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google ID token"
            )
        
        data = response.json()
        
        # Verify the token is for our app
        if data.get("aud") != GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token not issued for this application"
            )
        
        return GoogleUserInfo(
            email=data["email"],
            name=data.get("name", data["email"].split("@")[0]),
            picture=data.get("picture"),
            google_id=data["sub"],
            email_verified=data.get("email_verified", False)
        )


async def exchange_code_for_tokens(code: str) -> dict:
    """
    Exchange authorization code for access token and ID token.
    Used in OAuth2 authorization code flow.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to exchange authorization code"
            )
        
        return response.json()


async def get_google_user_info(access_token: str) -> GoogleUserInfo:
    """
    Get user info from Google using access token.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to get user info from Google"
            )
        
        data = response.json()
        
        return GoogleUserInfo(
            email=data["email"],
            name=data.get("name", data["email"].split("@")[0]),
            picture=data.get("picture"),
            google_id=data["id"],
            email_verified=data.get("verified_email", False)
        )


def get_or_create_user(
    db: Session,
    google_user: GoogleUserInfo,
    hr_id: str
) -> models.Employee:
    """
    Find existing user by email/google_id or create new one.
    Links Google account if user exists but hasn't linked Google.
    """
    # Try to find by email first
    user = db.query(models.Employee).filter(
        models.Employee.email == google_user.email
    ).first()
    
    if user:
        # Update Google ID if not set
        if not user.google_id:
            user.google_id = google_user.google_id
            user.profile_picture = google_user.picture
            db.commit()
            db.refresh(user)
        return user
    
    # Create new user
    new_user = models.Employee(
        email=google_user.email,
        name=google_user.name,
        password_hash=hash_password(os.urandom(32).hex()),  # Random password for OAuth users
        role="employee",
        google_id=google_user.google_id,
        profile_picture=google_user.picture,
        email_verified=google_user.email_verified
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/login-url")
async def get_google_login_url(hr_id: str):
    """
    Get the Google OAuth login URL for redirect-based flow.
    Frontend redirects user to this URL.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    # Build OAuth URL with required scopes
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": hr_id,  # Pass HR ID through state parameter
        "prompt": "consent"
    }
    
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    login_url = f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    return {"login_url": login_url}


@router.post("/callback", response_model=GoogleAuthResponse)
async def google_auth_callback(request: GoogleAuthRequest):
    """
    Handle Google OAuth callback.
    Accepts either:
    - Authorization code (from redirect flow)
    - ID token (from Google Sign-In button)
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    google_user: GoogleUserInfo
    
    if request.id_token:
        # Verify ID token directly (Google Sign-In button flow)
        google_user = await verify_google_id_token(request.id_token)
    elif request.code:
        # Exchange code for tokens (redirect flow)
        tokens = await exchange_code_for_tokens(request.code)
        
        if "id_token" in tokens:
            google_user = await verify_google_id_token(tokens["id_token"])
        else:
            google_user = await get_google_user_info(tokens["access_token"])
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'code' or 'id_token' is required"
        )
    
    # Get HR-specific database
    SessionHR = get_hr_db(request.hr_id)
    db = SessionHR()
    
    try:
        # Get or create user in HR database
        user = get_or_create_user(db, google_user, request.hr_id)
        
        # Create JWT token
        token_data = {
            "sub": user.email,
            "hr_id": request.hr_id,
            "role": user.role,
            "google_auth": True
        }
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return GoogleAuthResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "profile_picture": user.profile_picture,
                "email_verified": user.email_verified
            }
        )
    finally:
        db.close()


@router.post("/link")
async def link_google_account(
    request: GoogleAuthRequest,
    # current_user: models.Employee = Depends(get_current_employee)  # Uncomment when ready
):
    """
    Link Google account to existing user.
    User must be logged in with email/password first.
    """
    if not request.id_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID token required for linking"
        )
    
    google_user = await verify_google_id_token(request.id_token)
    
    # Get HR-specific database
    SessionHR = get_hr_db(request.hr_id)
    db = SessionHR()
    
    try:
        # For now, find user by email (replace with current_user when auth is added)
        user = db.query(models.Employee).filter(
            models.Employee.email == google_user.email
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if Google ID is already linked to another account
        existing = db.query(models.Employee).filter(
            models.Employee.google_id == google_user.google_id,
            models.Employee.id != user.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This Google account is already linked to another user"
            )
        
        # Link Google account
        user.google_id = google_user.google_id
        user.profile_picture = google_user.picture
        user.email_verified = google_user.email_verified
        
        db.commit()
        
        return {"message": "Google account linked successfully"}
    finally:
        db.close()
