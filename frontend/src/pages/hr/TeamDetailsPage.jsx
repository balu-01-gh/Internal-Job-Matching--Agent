/**
 * hr/TeamDetailsPage.jsx
 * HR views full details of a specific team, including members and skill distribution.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hrAPI, teamAPI } from '../../services/api'
import SkillBadge from '../../components/SkillBadge'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

export default function TeamDetailsPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const [team, setTeam]       = useState(null)
  const [heatmap, setHeatmap] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      hrAPI.teamDetails(teamId),
      teamAPI.heatmap(teamId),
    ]).then(([teamRes, hmRes]) => {
      setTeam(teamRes.data)
      setHeatmap(hmRes.data)
    }).finally(() => setLoading(false))
  }, [teamId])

  // Skill frequency for pie chart
  const skillFreq = heatmap
    ? heatmap.all_skills.map((skill) => ({
        name: skill,
        value: heatmap.employees.filter((e) =>
          e.skills.map((s) => s.toLowerCase()).includes(skill)
        ).length,
      })).sort((a, b) => b.value - a.value).slice(0, 8)
    : []

  if (loading) return <p className="text-gray-400 text-sm">Loading team details…</p>
  if (!team)   return <p className="text-red-500 text-sm">Team not found.</p>

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-brand-600 text-sm hover:underline">
          ← Back
        </button>
        <h2 className="text-xl font-bold">{team.team_name}</h2>
        <span className="badge bg-brand-50 text-brand-700">
          {team.members?.length} members
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-700">{team.members?.length}</p>
          <p className="text-xs text-gray-400 mt-1">Team Size</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-700">
            {team.members?.length
              ? (team.members.reduce((s, m) => s + m.experience, 0) / team.members.length).toFixed(1)
              : 0}y
          </p>
          <p className="text-xs text-gray-400 mt-1">Avg Experience</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-700">{heatmap?.all_skills?.length || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Unique Skills</p>
        </div>
      </div>

      {/* Skill distribution pie */}
      {skillFreq.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Top Skills Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={skillFreq}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {skillFreq.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} members`, 'Have skill']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Member list */}
      <div>
        <h3 className="font-semibold mb-4">Team Members</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.members?.map((member) => (
            <div key={member.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{member.name}</h4>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-brand-700">{member.experience}y</span>
                  {member.id === team.team_lead_id && (
                    <p className="text-xs text-brand-500 font-medium">Team Lead</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(member.skills || []).map((s) => (
                  <SkillBadge key={s} skill={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
