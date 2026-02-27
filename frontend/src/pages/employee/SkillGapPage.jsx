/**
 * employee/SkillGapPage.jsx
 * Shows employee's skill gaps against all top project matches.
 */

import React, { useEffect, useState } from 'react'
import { authAPI, projectAPI } from '../../services/api'
import SkillBadge from '../../components/SkillBadge'
import ScoreBar from '../../components/ScoreBar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export default function SkillGapPage() {
  const user = getUser()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    authAPI.topProjects()
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false))
  }, [])

  const chartData = projects.map((p) => ({
    name: p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title,
    gap: p.skill_gap.length,
    covered: p.required_skills.length - p.skill_gap.length,
  }))

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold">Skill Gap Analysis</h2>
        <p className="text-gray-500 text-sm mt-1">
          Gaps between your skills and top matching project requirements.
        </p>
      </div>

      {/* Your current skills */}
      <div className="card">
        <h3 className="font-semibold mb-3">Your Current Skills</h3>
        <div className="flex flex-wrap gap-2">
          {(user?.skills || []).map((s) => (
            <SkillBadge key={s} skill={s} variant="green" />
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Experience: <strong className="text-gray-700">{user?.experience} years</strong>
        </p>
      </div>

      {/* Gap chart */}
      {!loading && projects.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Skill Gap per Project</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="covered" stackId="a" fill="#22c55e" name="Covered" />
              <Bar dataKey="gap"     stackId="a" fill="#ef4444" name="Gap"     />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded inline-block" /> Covered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500  rounded inline-block" /> Gap</span>
          </div>
        </div>
      )}

      {/* Per-project breakdown */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        projects.map((proj) => (
          <div key={proj.project_id} className="card">
            <h4 className="font-semibold">{proj.title}</h4>
            <ScoreBar value={proj.match_percentage} max={100} label="Match" />

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-green-600 mb-2">
                  ✓ You have ({proj.required_skills.length - proj.skill_gap.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {proj.required_skills
                    .filter((s) => !proj.skill_gap.includes(s))
                    .map((s) => <SkillBadge key={s} skill={s} variant="green" />)}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-red-500 mb-2">
                  ✗ You need to develop ({proj.skill_gap.length})
                </p>
                {proj.skill_gap.length === 0 ? (
                  <p className="text-xs text-green-600">Full coverage! 🎉</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {proj.skill_gap.map((s) => <SkillBadge key={s} skill={s} variant="red" />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
