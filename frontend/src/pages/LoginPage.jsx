/**
 * LoginPage.jsx - JWT login form. Accepts email or username. Redirects based on role.
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-700">KLH Match</h1>
          <p className="text-gray-500 text-sm mt-1">AI Team-Project Matching</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email or Username</label>
            <input
              type="text"
              className="input"
              placeholder="you@klh.com or your_username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HR ID</label>
            <input
              type="text"
              className="input"
              placeholder="HR001"
              value={form.hr_id}
              onChange={(e) => setForm({ ...form, hr_id: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{' '}
          <Link to="/signup" className="text-brand-600 hover:underline font-medium">
            Register
          </Link>
        </p>

        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500 mb-1">Demo accounts:</p>
          <p>HR: hr@klh.com / hr123</p>
          <p>Lead: arjun_lead / pass123</p>
          <p>Dev: meera_dev / pass123</p>
        </div>
      </div>
    </div>
  )
}
