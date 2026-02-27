/**
 * SignupPage.jsx
 * Three-tab registration: Employee | Team Lead | HR
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI, authAPI } from '../services/api'

// ─── tiny reusable field wrapper ────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {hint && <span className="text-gray-400 font-normal text-xs">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Tab button ──────────────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
        active
          ? 'border-brand-600 text-brand-700 bg-white'
          : 'border-transparent text-gray-500 hover:text-brand-600 bg-gray-50'
      }`}
    >
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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const code = form.team_code.trim()
    if (code.length < 3) { setForm((f) => ({ ...f, team_name: '' })); setLookupStatus(''); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await registerAPI.teamLookup(code)
        setForm((f) => ({ ...f, team_name: data.team_name }))
        setLookupStatus('✓ Team found')
      } catch {
        setForm((f) => ({ ...f, team_name: '' }))
        setLookupStatus('Team not found')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.team_code])

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
      const { data: tokenData } = await authAPI.login(form.email, form.password)
      localStorage.setItem('token', tokenData.access_token)
      const { data: user } = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(user))
      onSuccess(user)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
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
      const { data: tokenData } = await authAPI.login(form.lead_email, form.password)
      localStorage.setItem('token', tokenData.access_token)
      const { data: user } = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(user))
      onSuccess(user)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
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
  const [form, setForm] = useState({
    hr_id: '', name: '', email: '',
    username: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      // Do NOT auto-login as employee after HR registration
      onSuccess({ role: 'hr' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
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

  function handleSuccess(user) {
    if (user.role === 'hr') navigate('/hr/add-project')
    else navigate('/upload-resume')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-brand-700 px-8 py-6 text-center">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-brand-200 text-sm mt-1">Join KLH Match Platform</p>
        </div>
        <div className="flex border-b border-gray-200 bg-gray-50">
          {TABS.map((t, i) => (
            <Tab key={t} active={tab === i} onClick={() => setTab(i)}>{t}</Tab>
          ))}
        </div>
        <div className="px-8 py-6">
          {tab === 0 && <EmployeeForm onSuccess={handleSuccess} />}
          {tab === 1 && <TeamLeadForm onSuccess={handleSuccess} />}
          {tab === 2 && <HRForm onSuccess={handleSuccess} />}
        </div>
        <p className="text-center text-sm text-gray-500 pb-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
