/**
 * employee/Dashboard.jsx
 * Shows employee profile summary + Top 5 matching projects with skill gaps.
 */

import React, { useEffect, useState } from 'react'
import { authAPI } from '../../services/api'
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
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage]     = useState('')

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true)
    if (!user?.hr_id) {
      setMessage('HR ID missing. Please login again.')
      setProjects([])
      setLoading(false)
      return
    }
    try {
      const { data } = await projectAPI.list(user.hr_id)
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
      <div className="card flex items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(user?.skills || []).map((s) => (
              <SkillBadge key={s} skill={s} />
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-brand-700">{user?.experience}y</p>
          <p className="text-xs text-gray-400">Experience</p>
          <label className="mt-3 block">
            <span className="btn-primary text-xs cursor-pointer px-3 py-1.5">
              {uploading ? 'Uploading…' : 'Upload Resume (PDF)'}
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
        <p className="text-sm text-brand-600 bg-brand-50 px-4 py-2 rounded-lg">{message}</p>
      )}

      {/* Top 5 Projects */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Top 5 Matching Projects</h3>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400 text-sm">No matching projects found. Upload a resume to generate embeddings.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((proj, i) => (
              <div key={proj.project_id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                      <h4 className="font-semibold text-gray-800">{proj.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{proj.description}</p>

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
                    <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center">
                      <span className="text-xl font-bold text-brand-700">
                        {proj.match_percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {proj.skill_gap.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-red-500 font-medium mb-1">
                      Skills to develop ({proj.skill_gap.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
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
        <div className="card">
          <h3 className="text-base font-semibold mb-4">Skill Coverage — Top Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <Radar
                name="Has Skill"
                dataKey="hasSkill"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.4}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
