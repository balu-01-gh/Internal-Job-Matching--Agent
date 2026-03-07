/**
 * GoogleSignIn.jsx - Google OAuth Sign-In Button Component
 * Provides one-click Google authentication
 */

import React, { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Google Sign-In Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Google Sign-In Button Component
 * 
 * @param {Object} props
 * @param {string} props.hrId - HR ID for multi-tenant authentication
 * @param {Function} props.onSuccess - Callback on successful login
 * @param {Function} props.onError - Callback on error
 * @param {string} props.text - Button text variant
 */
export default function GoogleSignIn({ 
  hrId, 
  onSuccess, 
  onError,
  text = 'signin_with',  // 'signin_with', 'signup_with', 'continue_with', 'signin'
  theme = 'outline',     // 'outline', 'filled_blue', 'filled_black'
  size = 'large',        // 'small', 'medium', 'large'
  width = '100%'
}) {
  const navigate = useNavigate()
  const buttonRef = React.useRef(null)

  // Handle Google credential response
  const handleCredentialResponse = useCallback(async (response) => {
    try {
      // Send ID token to backend for verification
      const res = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: response.credential,
          hr_id: hrId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Google sign-in failed')
      }

      const data = await res.json()
      
      // Store token and user
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Success callback
      if (onSuccess) {
        onSuccess(data)
      } else {
        // Default: redirect based on role
        if (data.user.role === 'hr') {
          navigate('/hr/add-project')
        } else if (data.user.role === 'team_lead') {
          navigate('/team-lead/overview')
        } else {
          navigate('/employee/dashboard')
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err)
      if (onError) {
        onError(err)
      }
    }
  }, [hrId, navigate, onSuccess, onError])

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured')
      return
    }

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        // Render the button
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: theme,
            size: size,
            text: text,
            width: buttonRef.current.offsetWidth,
            logo_alignment: 'left',
          })
        }
      }
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        // Don't remove - might be used by other components
      }
    }
  }, [handleCredentialResponse, theme, size, text])

  // If Google Client ID not configured, show disabled button
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
      >
        <GoogleIcon className="w-5 h-5" />
        <span>Google Sign-In not configured</span>
      </button>
    )
  }

  return (
    <div 
      ref={buttonRef} 
      className="google-signin-button w-full min-h-[44px]"
      style={{ width }}
    />
  )
}

/**
 * Custom styled Google Sign-In Button
 * Use this if you want more control over styling
 */
export function GoogleSignInCustom({ 
  hrId, 
  onSuccess, 
  onError,
  loading = false,
  disabled = false
}) {
  const [isLoading, setIsLoading] = React.useState(false)

  // Not configured — show a clear disabled button instead of silently failing
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="relative group">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
        >
          <GoogleIcon className="w-5 h-5 opacity-40" />
          <span>Google Sign-In (not configured)</span>
        </button>
        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-10">
          Set VITE_GOOGLE_CLIENT_ID in your .env to enable
        </div>
      </div>
    )
  }

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/auth/google/login-url?hr_id=${hrId || 'HR001'}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Google Sign-In not available')
      }
      if (data.login_url) {
        window.location.href = data.login_url
      } else {
        throw new Error('Failed to get Google login URL')
      }
    } catch (err) {
      setIsLoading(false)
      onError?.(err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
    >
      {(isLoading || loading) ? (
        <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <GoogleIcon className="w-5 h-5" />
      )}
      <span>Continue with Google</span>
    </button>
  )
}

/**
 * Google Icon SVG
 */
function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

/**
 * Google OAuth Callback Handler
 * Place this component at /auth/google/callback route
 */
export function GoogleAuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = React.useState(null)

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state') // HR ID passed through state
    const errorParam = params.get('error')

    if (errorParam) {
      setError(errorParam)
      return
    }

    if (code && state) {
      // Exchange code for token
      fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, hr_id: state })
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('token', data.access_token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            // Redirect based on role
            if (data.user.role === 'hr') {
              navigate('/hr/add-project')
            } else if (data.user.role === 'team_lead') {
              navigate('/team-lead/overview')
            } else {
              navigate('/employee/dashboard')
            }
          } else {
            setError(data.detail || 'Authentication failed')
          }
        })
        .catch(err => {
          setError(err.message)
        })
    } else {
      setError('Missing authentication parameters')
    }
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <svg className="animate-spin h-12 w-12 text-brand-600 mx-auto mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">Signing you in...</h2>
        <p className="text-gray-500 mt-2">Please wait while we verify your account</p>
      </div>
    </div>
  )
}
