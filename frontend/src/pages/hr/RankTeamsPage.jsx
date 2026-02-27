/**
 * hr/RankTeamsPage.jsx
 * Shows ranked teams for a selected project with match details.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hrAPI, projectAPI } from '../../services/api'
import ScoreBar from '../../components/ScoreBar'
import SkillBadge from '../../components/SkillBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function RankTeamsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject]   = useState(null)
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    projectAPI.list().then(({ data }) => setProjects(data))
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      projectAPI.get(projectId),
      hrAPI.top5Teams(projectId),
    ]).then(([projRes, rankRes]) => {
      setProject(projRes.data)
      setResults(rankRes.data.top_teams || [])
    }).finally(() => setLoading(false))
  }, [projectId])

  const chartData = results.map((r) => ({
    name: r.team_name,
    Embedding: +(r.embedding_similarity * 100).toFixed(1),
    'Skill Cov.': +(r.skill_coverage * 100).toFixed(1),
    Experience: +(r.experience_match * 100).toFixed(1),
    Balance: +(r.team_balance * 100).toFixed(1),
  }))

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Project selector */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">Top 5 Teams</h2>
        <select
          className="input w-64 text-sm"
          value={projectId || ''}
          onChange={(e) => navigate(`/hr/rank-teams/${e.target.value}`)}
        >
          <option value="">Select project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-400 text-sm">Evaluating teams…</p>}

      {!loading && project && (
        <>
          {/* Project info */}
          <div className="card border-l-4 border-brand-500">
            <h3 className="font-semibold text-lg">{project.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.required_skills.map((s) => <SkillBadge key={s} skill={s} />)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Requires {project.required_experience}+ years of experience
            </p>
          </div>

          {/* Stacked bar chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Score Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="Embedding"  fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Skill Cov." fill="#22c55e" stackId="a" />
                  <Bar dataKey="Experience" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="Balance"    fill="#8b5cf6" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                {[
                  { color: 'bg-blue-500',   label: 'Embedding (40%)' },
                  { color: 'bg-green-500',  label: 'Skill Coverage (30%)' },
                  { color: 'bg-amber-500',  label: 'Experience (20%)' },
                  { color: 'bg-violet-500', label: 'Team Balance (10%)' },
                ].map((i) => (
                  <span key={i.label} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded ${i.color}`} />
                    {i.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Team rank cards */}
          <div className="space-y-4">
            {results.map((team, i) => (
              <div key={team.team_id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{team.team_name}</h4>
                      <p className="text-xs text-gray-400">Team ID: {team.team_id}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-brand-700">
                      {team.match_percentage?.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">match</p>
                    <button
                      onClick={() => navigate(`/hr/team/${team.team_id}`)}
                      className="mt-2 text-xs text-brand-600 hover:underline"
                    >
                      View details →
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                  <ScoreBar label="Embedding Similarity (40%)" value={team.embedding_similarity * 100} />
                  <ScoreBar label="Skill Coverage (30%)"       value={team.skill_coverage * 100} />
                  <ScoreBar label="Experience Match (20%)"     value={team.experience_match * 100} />
                  <ScoreBar label="Team Balance (10%)"         value={team.team_balance * 100} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
