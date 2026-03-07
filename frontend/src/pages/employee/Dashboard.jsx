/**
 * employee/Dashboard.jsx
 * Shows employee profile summary + Top 5 matching projects with skill gaps.
 */

import React, { useEffect, useState } from 'react'
import { authAPI, projectAPI } from '../../services/api'
import ScoreBar from '../../components/ScoreBar'
import SkillBadge from '../../components/SkillBadge'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export default function EmployeeDashboard() {
  const user = getUser()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const { data } = await authAPI.topProjects()
      setProjects(data)
    } catch (e) {
      setMessage('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function handleResumeUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setMessage('')
    try {
      await authAPI.uploadResume(file)
      await authAPI.updateEmbedding()
      setMessage('Resume uploaded! Refreshing matches…')
      await fetchProjects()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Build radar data from first project's required skills vs employee skills
  const radarData = projects[0]
    ? projects[0].required_skills.map((skill) => ({
      subject: skill,
      hasSkill: (user?.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase()) ? 1 : 0,
    }))
    : []

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Profile header */}
      <div className="card-gradient flex items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400/20 to-transparent rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-brand-400/20 to-transparent rounded-full translate-y-6 -translate-x-6" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">{user?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(user?.skills || []).map((s) => (
              <SkillBadge key={s} skill={s} />
            ))}
          </div>
        </div>
        <div className="text-right shrink-0 relative z-10">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl px-5 py-3 shadow-lg">
            <p className="text-3xl font-bold">{user?.experience}y</p>
            <p className="text-xs text-brand-100">Experience</p>
          </div>
          <label className="mt-3 block">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-xs cursor-pointer px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all">
              <span>📄</span> {uploading ? 'Uploading…' : 'Upload Resume'}
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleResumeUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {message && (
        <p className="text-sm text-success-700 bg-gradient-to-r from-success-50 to-success-100 px-4 py-3 rounded-xl border border-success-200 flex items-center gap-2 shadow-sm">
          <span className="text-success-500">✓</span> {message}
        </p>
      )}

      {/* Top 5 Projects */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-sm shadow-md">🎯</span>
          <span className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Top 5 Matching Projects</span>
        </h3>
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="card-gradient text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No matching projects found.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Upload a resume to generate embeddings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((proj, i) => (
              <div key={proj.project_id} className="card-gradient hover:shadow-xl transition-all duration-300 border-l-4 border-l-brand-500 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                        i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                        i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                        i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                        'bg-gradient-to-br from-brand-400 to-brand-500'
                      }`}>
                        {i + 1}
                      </span>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{proj.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{proj.description}</p>

                    <ScoreBar
                      label="Match Score"
                      value={proj.match_percentage}
                      max={100}
                    />

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {proj.required_skills.map((s) => (
                        <SkillBadge
                          key={s}
                          skill={s}
                          variant={proj.skill_gap.includes(s) ? 'red' : 'green'}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`w-18 h-18 rounded-full flex items-center justify-center shadow-lg ${
                      proj.match_percentage >= 80 ? 'bg-gradient-to-br from-success-400 to-success-600' :
                      proj.match_percentage >= 60 ? 'bg-gradient-to-br from-brand-400 to-brand-600' :
                      proj.match_percentage >= 40 ? 'bg-gradient-to-br from-warning-400 to-warning-600' :
                      'bg-gradient-to-br from-danger-400 to-danger-600'
                    }`} style={{ width: '4.5rem', height: '4.5rem' }}>
                      <span className="text-xl font-bold text-white">
                        {proj.match_percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {proj.skill_gap.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100/80 dark:border-gray-700/50">
                    <p className="text-xs text-danger-600 font-semibold mb-2 flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-danger-100 rounded-full flex items-center justify-center text-danger-500">⚡</span>
                      Skills to develop ({proj.skill_gap.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.skill_gap.map((s) => (
                        <SkillBadge key={s} skill={s} variant="red" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Radar chart for top project */}
      {radarData.length > 0 && (
        <div className="card-gradient relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
          
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 relative z-10">
            <span className="w-8 h-8 bg-gradient-to-br from-accent-500 to-brand-500 rounded-lg flex items-center justify-center text-white text-sm shadow-md">📊</span>
            <span className="bg-gradient-to-r from-accent-700 to-brand-600 bg-clip-text text-transparent">Skill Coverage — Top Project</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
              <Radar
                name="Has Skill"
                dataKey="hasSkill"
                stroke="#8b5cf6"
                fill="url(#radarGradient)"
                fillOpacity={0.6}
              />
              <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ 
                  background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
