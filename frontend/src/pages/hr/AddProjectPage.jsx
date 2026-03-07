/**
 * hr/AddProjectPage.jsx
 * HR can create new projects and then immediately evaluate teams.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectAPI, hrAPI } from '../../services/api'
import SkillBadge from '../../components/SkillBadge'
import ReportExport from '../../components/ReportExport'
import NotificationCenter from '../../components/NotificationCenter'

export default function AddProjectPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '',
    required_skills: '', required_experience: '2',
  })
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [message, setMessage]     = useState({ text: '', type: '' })
  const [showExports, setShowExports] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  function getUser() {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  }
  const user = getUser()

  async function fetchProjects() {
    if (!user?.emp_id && !user?.hr_id) {
      setProjects([])
      return
    }
    const hrId = user.hr_id || user.emp_id
    try {
      const { data } = await projectAPI.list(hrId)
      setProjects(data)
    } catch (e) {
      setProjects([])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const payload = {
        title: form.title,
        description: form.description,
        required_skills: form.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
        required_experience: parseFloat(form.required_experience) || 1,
      }
      const { data: proj } = await projectAPI.create(payload)
      setMessage({ text: `Project "${proj.title}" created and embedded!`, type: 'success' })
      setForm({ title: '', description: '', required_skills: '', required_experience: '2' })
      await fetchProjects()
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to create project', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleEvaluate(projectId) {
    await hrAPI.evaluate(projectId)
    navigate(`/hr/rank-teams/${projectId}`)
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  })

  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">👔</span>
          <span className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">HR Dashboard</span>
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`btn-secondary text-sm flex items-center gap-2 ${showNotifications ? 'ring-2 ring-accent-400' : ''}`}
          >
            <span>🔔</span> {showNotifications ? 'Hide' : 'Show'} Notifications
          </button>
          <button
            onClick={() => setShowExports(!showExports)}
            className={`btn-secondary text-sm flex items-center gap-2 ${showExports ? 'ring-2 ring-brand-400' : ''}`}
          >
            <span>📊</span> {showExports ? 'Hide' : 'Show'} Reports
          </button>
        </div>
      </div>

      {/* Notifications */}
      {showNotifications && (
        <NotificationCenter userId={user?.id} userRole={user?.role} />
      )}

      {/* Report Export */}
      {showExports && (
        <ReportExport 
          onExport={(data) => console.log('Exporting:', data)} 
        />
      )}

      {/* Create form */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-gradient-to-br from-success-400 to-success-600 rounded-lg flex items-center justify-center text-white text-xs shadow-md">+</span>
          <span>Add New Project</span>
        </h3>
        <div className="card-gradient relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Project Title</label>
              <input className="input" placeholder="AI Customer Support Chatbot" {...field('title')} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Describe the project scope, goals, and deliverables…"
                {...field('description')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Required Skills <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                className="input"
                placeholder="Python, React, FastAPI, NLP"
                {...field('required_skills')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min. Experience (years)</label>
              <input type="number" min="0" step="0.5" className="input" {...field('required_experience')} />
            </div>
          </div>

          {message.text && (
            <div className={`text-sm px-4 py-3 rounded-xl flex items-center gap-2 ${
              message.type === 'success'
                ? 'text-success-700 bg-gradient-to-r from-success-50 to-success-100 border border-success-200'
                : 'text-danger-700 bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200'
            }`}>
              <span>{message.type === 'success' ? '✓' : '✗'}</span>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <span>🚀</span> Create Project & Generate Embedding
              </>
            )}
          </button>
        </form>
        </div>
      </div>

      {/* Existing projects */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white text-xs shadow-md">📁</span>
          <span>All Projects</span>
          <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs rounded-full font-medium">{projects.length}</span>
        </h3>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="card-gradient text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No projects yet. Create your first one above!</p>
            </div>
          ) : projects.map((proj, i) => (
            <div key={proj.id} className="card-gradient flex items-start justify-between gap-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent-500 group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold group-hover:text-brand-700 transition-colors">{proj.title}</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {proj.required_skills.map((s) => <SkillBadge key={s} skill={s} />)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg mb-2">
                  <span>⏱️</span> {proj.required_experience}y exp. required
                </div>
                <br />
                <button
                  onClick={() => handleEvaluate(proj.id)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Evaluate Teams <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
