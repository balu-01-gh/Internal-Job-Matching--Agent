/**
 * hr/AddProjectPage.jsx
 * HR can create new projects and then immediately evaluate teams.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectAPI, hrAPI } from '../../services/api'
import SkillBadge from '../../components/SkillBadge'

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
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-xl font-bold">Add New Project</h2>

      {/* Create form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Project Title</label>
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
            <p className={`text-sm px-3 py-2 rounded-lg ${
              message.type === 'success'
                ? 'text-green-700 bg-green-50'
                : 'text-red-600 bg-red-50'
            }`}>
              {message.text}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Project & Generate Embedding'}
          </button>
        </form>
      </div>

      {/* Existing projects */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Projects ({projects.length})</h3>
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">{proj.title}</h4>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {proj.required_skills.map((s) => <SkillBadge key={s} skill={s} />)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400 mb-2">
                  {proj.required_experience}y exp. required
                </p>
                <button
                  onClick={() => handleEvaluate(proj.id)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  Evaluate Teams →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
