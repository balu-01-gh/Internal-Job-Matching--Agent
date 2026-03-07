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
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">📊</span>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Skill Gap Analysis</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Gaps between your skills and top matching project requirements.
          </p>
        </div>
      </div>

      {/* Your current skills */}
      <div className="card-gradient relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-success-400/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-gradient-to-br from-success-400 to-success-600 rounded-lg flex items-center justify-center text-white text-xs">✓</span>
          Your Current Skills
        </h3>
        <div className="flex flex-wrap gap-2 relative z-10">
          {(user?.skills || []).map((s) => (
            <SkillBadge key={s} skill={s} variant="green" />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-xl px-4 py-2 shadow-md">
            <p className="text-lg font-bold">{user?.experience}y</p>
            <p className="text-[10px] text-brand-100">Experience</p>
          </div>
          <div className="bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl px-4 py-2 shadow-md">
            <p className="text-lg font-bold">{user?.skills?.length || 0}</p>
            <p className="text-[10px] text-accent-100">Total Skills</p>
          </div>
        </div>
      </div>

      {/* Gap chart */}
      {!loading && projects.length > 0 && (
        <div className="card-gradient relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-400/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gradient-to-br from-brand-400 to-accent-500 rounded-lg flex items-center justify-center text-white text-xs">📈</span>
            Skill Gap per Project
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="covered" stackId="a" fill="#22c55e" name="Covered" radius={[0, 4, 4, 0]} />
              <Bar dataKey="gap"     stackId="a" fill="#ef4444" name="Gap" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
            <span className="flex items-center gap-2 text-success-600 font-medium"><span className="w-3 h-3 bg-gradient-to-br from-success-400 to-success-600 rounded-sm shadow-sm" /> Skills You Have</span>
            <span className="flex items-center gap-2 text-danger-600 font-medium"><span className="w-3 h-3 bg-gradient-to-br from-danger-400 to-danger-600 rounded-sm shadow-sm" /> Skills to Develop</span>
          </div>
        </div>
      )}

      {/* Per-project breakdown */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing skill gaps...</span>
        </div>
      ) : (
        projects.map((proj, index) => (
          <div key={proj.project_id} className="card-gradient hover:shadow-lg transition-all duration-300 border-l-4 border-l-brand-500 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                  'bg-gradient-to-br from-brand-400 to-brand-500'
                }`}>{index + 1}</span>
                <h4 className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{proj.title}</h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                proj.skill_gap.length === 0 
                  ? 'bg-success-100 text-success-700' 
                  : proj.skill_gap.length <= 2 
                    ? 'bg-warning-100 text-warning-700'
                    : 'bg-danger-100 text-danger-700'
              }`}>
                {proj.skill_gap.length === 0 ? '✓ Ready' : `${proj.skill_gap.length} gaps`}
              </span>
            </div>
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
