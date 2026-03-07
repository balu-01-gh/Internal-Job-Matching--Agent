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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all">
            ←
          </button>
          <span className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">👥</span>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">{team.team_name}</h2>
            <span className="text-xs text-gray-500">{team.members?.length} team members</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-gradient text-center relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
          <div className="relative z-10">
            <p className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">{team.members?.length}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Team Size</p>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="card-gradient text-center relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent" />
          <div className="relative z-10">
            <p className="text-3xl font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">
              {team.members?.length
                ? (team.members.reduce((s, m) => s + m.experience, 0) / team.members.length).toFixed(1)
                : 0}y
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Avg Experience</p>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-accent-400 to-accent-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="card-gradient text-center relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-success-500/5 to-transparent" />
          <div className="relative z-10">
            <p className="text-3xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">{heatmap?.all_skills?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Unique Skills</p>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-success-400 to-success-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Skill distribution pie */}
      {skillFreq.length > 0 && (
        <div className="card-gradient relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
          <h3 className="font-semibold mb-4 flex items-center gap-2 relative z-10">
            <span className="w-6 h-6 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center text-white text-xs">🎯</span>
            Top Skills Distribution
          </h3>
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
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white text-xs">👤</span>
          Team Members
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.members?.map((member) => (
            <div key={member.id} className="card-gradient hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-400/10 to-transparent rounded-full -translate-y-6 translate-x-6" />
              <div className="flex items-start justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="font-semibold group-hover:text-brand-700 transition-colors">{member.name}</h4>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">{member.experience}y</span>
                  {member.id === team.team_lead_id && (
                    <p className="text-xs text-brand-500 font-medium mt-1 flex items-center justify-end gap-1"><span>⭐</span> Team Lead</p>
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
