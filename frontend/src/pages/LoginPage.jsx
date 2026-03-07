/**
 * LoginPage.jsx - JWT login form. Accepts email or username. Redirects based on role.
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { GoogleSignInCustom } from '../components/GoogleSignIn'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', hr_id: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Get token (email field accepts email OR username)
      const { data: tokenData } = await authAPI.login(form.email, form.password, form.hr_id)
      localStorage.setItem('token', tokenData.access_token)

      // 2. Fetch user profile
      const { data: user } = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(user))

      // 3. Role-based redirect — employees/leads go to resume upload first if not done
      if (user.role === 'hr') {
        navigate('/hr/add-project')
      } else if (!user.resume_uploaded) {
        navigate('/upload-resume')
      } else if (user.role === 'team_lead') {
        navigate('/team-lead/overview')
      } else {
        navigate('/employee/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-accent-600 to-brand-800 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-accent-300/20 rounded-full blur-2xl animate-float-delayed" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating icons */}
        <div className="absolute top-20 left-20 text-4xl animate-float opacity-20">👥</div>
        <div className="absolute top-40 right-32 text-3xl animate-float-delayed opacity-20">📊</div>
        <div className="absolute bottom-32 left-24 text-3xl animate-float opacity-20">⚡</div>
        <div className="absolute bottom-20 right-20 text-4xl animate-float-delayed opacity-20">🎯</div>
      </div>
      
      <div className="w-full max-w-md relative z-10 mx-4 animate-scale-in">
        {/* Glowing card effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-400 rounded-3xl blur-xl opacity-30 animate-glow" />
        
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-500 via-brand-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/40 transform hover:scale-105 transition-transform">
                <span className="text-4xl">🚀</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-[10px]">✓</span>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-gradient-animated">
              KLH Match
            </h1>
            <p className="text-gray-500 mt-2 text-sm">AI-Powered Team-Project Matching Platform</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">Smart Matching</span>
              <span className="px-3 py-1 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full">Team Analytics</span>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Email or Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
              <input
                type="text"
                className="input pl-11"
                placeholder="you@klh.com or username"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">HR ID</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🏢</span>
              <input
                type="text"
                className="input pl-11"
                placeholder="HR001"
                value={form.hr_id}
                onChange={(e) => setForm({ ...form, hr_id: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
              <input
                type="password"
                className="input pl-11"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <GoogleSignInCustom
            hrId={form.hr_id || 'HR001'}
            onSuccess={(data) => {
              if (data.user.role === 'hr') {
                navigate('/hr/add-project')
              } else if (data.user.role === 'team_lead') {
                navigate('/team-lead/overview')
              } else {
                navigate('/employee/dashboard')
              }
            }}
            onError={(err) => setError(err.message || 'Google sign-in failed')}
          />
        </form>

        <div className="divider-text my-6">
          <span>No account?</span>
        </div>
        
        <Link 
          to="/signup" 
          className="block w-full text-center py-3 border-2 border-brand-500 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-all duration-300"
        >
          Create Account →
        </Link>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-600 mb-1 text-center uppercase tracking-wider">
            🎪 Demo Accounts — click to fill
          </p>
          <p className="text-xs text-center text-gray-400 mb-4">HR ID: <span className="font-mono font-semibold">HR001</span></p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setForm({ email: 'hr@klh.com', password: 'hr123', hr_id: 'HR001' })}
              className="bg-gradient-to-br from-brand-50 via-brand-100 to-brand-50 p-4 rounded-xl text-center border border-brand-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group w-full"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">👔</span>
              </div>
              <p className="font-bold text-brand-700">HR Admin</p>
              <p className="text-gray-600 mt-1 font-medium">hr@klh.com</p>
              <p className="text-gray-400 font-mono">hr123</p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'arjun_lead', password: 'pass123', hr_id: 'HR001' })}
              className="bg-gradient-to-br from-accent-50 via-accent-100 to-accent-50 p-4 rounded-xl text-center border border-accent-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group w-full"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">👨‍💼</span>
              </div>
              <p className="font-bold text-accent-700">Team Lead</p>
              <p className="text-gray-600 mt-1 font-medium">arjun_lead</p>
              <p className="text-gray-400 font-mono">pass123</p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'meera_dev', password: 'pass123', hr_id: 'HR001' })}
              className="bg-gradient-to-br from-success-50 via-success-100 to-success-50 p-4 rounded-xl text-center border border-success-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group w-full"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">👩‍💻</span>
              </div>
              <p className="font-bold text-success-700">Developer</p>
              <p className="text-gray-600 mt-1 font-medium">meera_dev</p>
              <p className="text-gray-400 font-mono">pass123</p>
            </button>
          </div>
        </div>
        
        {/* Footer branding */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-gradient">AI Embeddings</span> & <span className="font-semibold text-gradient">Smart Matching</span>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
