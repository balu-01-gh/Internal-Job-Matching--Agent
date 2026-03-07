/**
 * SignupPage.jsx
 * Three-tab registration: Employee | Team Lead | HR
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI, authAPI } from '../services/api'

// ─── tiny reusable field wrapper ────────────────────────────
function Field({ label, children, hint, icon }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        {icon && <span className="mr-1">{icon}</span>}
        {label} 
        {hint && <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Tab button ──────────────────────────────────────────────
function Tab({ active, onClick, children, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${active
        ? 'bg-white text-brand-700 shadow-lg rounded-xl -translate-y-0.5 border-b-2 border-brand-500'
        : 'text-gray-500 hover:text-brand-600 hover:bg-white/50 rounded-xl'
        }`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

// ─── Employee Registration ───────────────────────────────────
function EmployeeForm({ onSuccess }) {
  const [form, setForm] = useState({
    emp_id: '', name: '', email: '',
    hr_id: '',
    team_code: '', team_name: '',
    username: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupStatus, setLookupStatus] = useState('')
  const [success, setSuccess] = useState(false)
  const [registeredUser, setRegisteredUser] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const code = form.team_code.trim()
    const hrId = form.hr_id.trim()
    if (code.length < 3 || hrId.length < 2) { setForm((f) => ({ ...f, team_name: '' })); setLookupStatus(''); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await registerAPI.teamLookup(code, hrId)
        setForm((f) => ({ ...f, team_name: data.team_name }))
        setLookupStatus('✓ Team found')
      } catch {
        setForm((f) => ({ ...f, team_name: '' }))
        setLookupStatus('Team not found')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.team_code, form.hr_id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    try {
      await registerAPI.employee({
        emp_id: form.emp_id, name: form.name, email: form.email,
        hr_id: form.hr_id,
        team_code: form.team_code, username: form.username,
        password: form.password, password2: form.password2,
      })
      const { data: tokenData } = await authAPI.login(form.email, form.password, form.hr_id)
      localStorage.setItem('token', tokenData.access_token)
      const { data: user } = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(user))
      setRegisteredUser(user)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
        <p className="text-gray-600 mb-6">Welcome, {registeredUser?.name || 'Employee'}! Your account has been created.</p>
        <button
          onClick={() => onSuccess(registeredUser)}
          className="btn-primary px-8"
        >
          Continue to Upload Resume
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Employee ID">
          <input className="input" placeholder="EMP001" value={form.emp_id} onChange={set('emp_id')} required />
        </Field>
        <Field label="Full Name">
          <input className="input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="HR ID" hint="provided by HR">
          <input className="input" placeholder="HR001" value={form.hr_id} onChange={set('hr_id')} required />
        </Field>
      </div>
      <Field label="Email">
        <input type="email" className="input" placeholder="you@klh.com" value={form.email} onChange={set('email')} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Team Code" hint="get from your Team Lead">
          <input className="input" placeholder="ALPHA01" value={form.team_code} onChange={set('team_code')} required />
          {lookupStatus && (
            <p className={`text-xs mt-1 ${lookupStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {lookupStatus}
            </p>
          )}
        </Field>
        <Field label="Team Name">
          <input className="input bg-gray-50" value={form.team_name} readOnly placeholder="Auto-filled" />
        </Field>
      </div>
      <Field label="Username">
        <input className="input" placeholder="john_doe" value={form.username} onChange={set('username')} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password">
          <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={set('password')} required />
        </Field>
        <Field label="Confirm Password">
          <input type="password" className="input" placeholder="••••••••" value={form.password2} onChange={set('password2')} required />
        </Field>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
        {loading ? 'Creating account…' : 'Register as Employee'}
      </button>
    </form>
  )
}

// ─── Team Lead Registration ──────────────────────────────────
function TeamLeadForm({ onSuccess }) {
  const [form, setForm] = useState({
    team_code: '', team_name: '',
    lead_name: '', lead_id: '', lead_email: '',
    hr_id: '',
    username: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredUser, setRegisteredUser] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    try {
      await registerAPI.teamlead({
        team_code: form.team_code, team_name: form.team_name,
        lead_name: form.lead_name, lead_id: form.lead_id,
        lead_email: form.lead_email, username: form.username,
        hr_id: form.hr_id,
        password: form.password, password2: form.password2,
      })
      const { data: tokenData } = await authAPI.login(form.lead_email, form.password, form.hr_id)
      localStorage.setItem('token', tokenData.access_token)
      const { data: user } = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(user))
      setRegisteredUser(user)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
        <p className="text-gray-600 mb-2">Welcome, {registeredUser?.name || 'Team Lead'}!</p>
        <p className="text-gray-500 text-sm mb-6">Your team "<strong>{form.team_name}</strong>" (Code: {form.team_code}) has been created.</p>
        <button
          onClick={() => onSuccess(registeredUser)}
          className="btn-primary px-8"
        >
          Continue to Upload Resume
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Team Code" hint="unique, share with members">
          <input className="input" placeholder="MYTEAM01" value={form.team_code} onChange={set('team_code')} required />
        </Field>
        <Field label="Team Name">
          <input className="input" placeholder="Alpha Squad" value={form.team_name} onChange={set('team_name')} required />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Lead Name">
          <input className="input" placeholder="Jane Smith" value={form.lead_name} onChange={set('lead_name')} required />
        </Field>
        <Field label="Lead ID">
          <input className="input" placeholder="LEAD001" value={form.lead_id} onChange={set('lead_id')} required />
        </Field>
        <Field label="HR ID" hint="provided by HR">
          <input className="input" placeholder="HR001" value={form.hr_id} onChange={set('hr_id')} required />
        </Field>
      </div>
      <Field label="Lead Email">
        <input type="email" className="input" placeholder="lead@klh.com" value={form.lead_email} onChange={set('lead_email')} required />
      </Field>
      <Field label="Username">
        <input className="input" placeholder="jane_lead" value={form.username} onChange={set('username')} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password">
          <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={set('password')} required />
        </Field>
        <Field label="Confirm Password">
          <input type="password" className="input" placeholder="••••••••" value={form.password2} onChange={set('password2')} required />
        </Field>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
        {loading ? 'Creating account…' : 'Register as Team Lead'}
      </button>
    </form>
  )
}

// ─── HR Registration ─────────────────────────────────────────
function HRForm({ onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    hr_id: '', name: '', email: '',
    username: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    try {
      await registerAPI.hr({
        hr_id: form.hr_id, name: form.name, email: form.email,
        username: form.username, password: form.password, password2: form.password2,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">HR Account Created!</h3>
        <p className="text-gray-600 mb-2">Welcome, {form.name}!</p>
        <p className="text-gray-500 text-sm mb-6">Your HR ID is <strong>{form.hr_id}</strong>. Share this with your team members during registration.</p>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary px-8"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="HR ID">
          <input className="input" placeholder="HR001" value={form.hr_id} onChange={set('hr_id')} required />
        </Field>
        <Field label="Full Name">
          <input className="input" placeholder="Priya Sharma" value={form.name} onChange={set('name')} required />
        </Field>
      </div>
      <Field label="Email">
        <input type="email" className="input" placeholder="hr@klh.com" value={form.email} onChange={set('email')} required />
      </Field>
      <Field label="Username">
        <input className="input" placeholder="hr_admin" value={form.username} onChange={set('username')} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password">
          <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={set('password')} required />
        </Field>
        <Field label="Confirm Password">
          <input type="password" className="input" placeholder="••••••••" value={form.password2} onChange={set('password2')} required />
        </Field>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
        {loading ? 'Creating account…' : 'Register as HR'}
      </button>
    </form>
  )
}

// ─── Main page ───────────────────────────────────────────────
const TABS = ['Employee', 'Team Lead', 'HR']

export default function SignupPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  const ICONS = ['👩‍💻', '👨‍💼', '👔']

  function handleSuccess(user) {
    if (user.role === 'hr') navigate('/hr/add-project')
    else navigate('/upload-resume')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-accent-600 to-brand-800 py-10 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-accent-300/20 rounded-full blur-2xl animate-float-delayed" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating decorations */}
        <div className="absolute top-20 right-20 text-4xl animate-float opacity-20">🎯</div>
        <div className="absolute bottom-32 left-20 text-3xl animate-float-delayed opacity-20">💼</div>
      </div>
      
      <div className="w-full max-w-xl relative z-10 mx-4 animate-scale-in">
        {/* Glowing effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-400 rounded-3xl blur-xl opacity-30" />
        
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 via-accent-600 to-brand-700 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/30">
                <span className="text-4xl">✨</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Join KLH Match</h1>
              <p className="text-white/80 mt-2 text-sm">Create your account and start matching with the perfect projects</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur">Step 1: Register</span>
                <span className="text-white/50">→</span>
                <span className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-full">Upload Resume</span>
                <span className="text-white/50">→</span>
                <span className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-full">Get Matched</span>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gradient-to-r from-gray-50 via-brand-50/30 to-accent-50/30 p-2 gap-2">
            {TABS.map((t, i) => (
              <Tab key={t} active={tab === i} onClick={() => setTab(i)} icon={ICONS[i]}>{t}</Tab>
            ))}
          </div>
          
          {/* Form content */}
          <div className="px-8 py-8">
            {tab === 0 && <EmployeeForm onSuccess={handleSuccess} />}
            {tab === 1 && <TeamLeadForm onSuccess={handleSuccess} />}
            {tab === 2 && <HRForm onSuccess={handleSuccess} />}
          </div>
          
          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="divider-text mb-4">
              <span>Already registered?</span>
            </div>
            <Link 
              to="/login" 
              className="block w-full text-center py-3 border-2 border-brand-500 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-all duration-300"
            >
              Sign In to Your Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
