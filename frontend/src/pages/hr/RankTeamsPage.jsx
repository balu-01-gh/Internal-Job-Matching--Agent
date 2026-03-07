/**
 * hr/RankTeamsPage.jsx
 * Shows ranked teams for a selected project with match details.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hrAPI, projectAPI } from '../../services/api'
import ScoreBar from '../../components/ScoreBar'
import SkillBadge from '../../components/SkillBadge'
import TeamFilter from '../../components/TeamFilter'
import MatchExplanation from '../../components/MatchExplanation'
import TeamScenarioSimulator from '../../components/TeamScenarioSimulator'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

import { parseJwt } from '../../utils/jwt'

export default function RankTeamsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [results, setResults] = useState([])
  const [filteredResults, setFilteredResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [selectedTeamForAnalysis, setSelectedTeamForAnalysis] = useState(null)
  const [showSimulator, setShowSimulator] = useState(false)
  const [availableSkills, setAvailableSkills] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const payload = parseJwt(token)
    const hr_id = payload?.hr_id
    if (hr_id) {
      projectAPI.list(hr_id).then(({ data }) => setProjects(data))
    }
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      projectAPI.get(projectId),
      hrAPI.top5Teams(projectId),
    ]).then(([projRes, rankRes]) => {
      setProject(projRes.data)
      const teamResults = rankRes.data.top_teams || []
      setResults(teamResults)
      setFilteredResults(teamResults)
      
      // Extract skills for filtering
      const skills = new Set()
      if (projRes.data?.required_skills) {
        projRes.data.required_skills.forEach(skill => skills.add(skill))
      }
      setAvailableSkills(Array.from(skills))
    }).finally(() => setLoading(false))
  }, [projectId])

  const handleFilterChange = (filters) => {
    let filtered = [...results]
    
    // Apply various filters based on team characteristics
    if (filters.skills.length > 0) {
      // For now, filter teams that might have these skills
      // In a real app, you'd need team member data
      filtered = filtered.filter(team => 
        filters.skills.some(skill => 
          team.team_name.toLowerCase().includes(skill.toLowerCase())
        )
      )
    }
    
    setFilteredResults(filtered)
  }

  const chartData = filteredResults.map((r) => ({
    name: r.team_name,
    Embedding: +(r.embedding_similarity * 100).toFixed(1),
    'Skill Cov.': +(r.skill_coverage * 100).toFixed(1),
    Experience: +(r.experience_match * 100).toFixed(1),
    Balance: +(r.team_balance * 100).toFixed(1),
  }))

  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl p-4 lg:p-0">
      {/* Project selector */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">🏆</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Top Teams Analysis</h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:ml-auto">
          <select
            className="input w-full lg:w-64 text-sm bg-white shadow-sm"
            value={projectId || ''}
            onChange={(e) => navigate(`/hr/rank-teams/${e.target.value}`)}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`btn-secondary text-sm flex items-center gap-2 ${showSimulator ? 'ring-2 ring-accent-400' : ''}`}
          >
            <span>🧪</span> {showSimulator ? 'Hide' : 'Show'} Simulator
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Evaluating teams with AI...</span>
        </div>
      )}

      {!loading && project && (
        <>
          {/* Team Filter */}
          <TeamFilter
            teams={results}
            onFilterChange={handleFilterChange}
            availableSkills={availableSkills}
          />

          {/* Team Scenario Simulator */}
          {showSimulator && (
            <TeamScenarioSimulator
              projectId={projectId}
              allEmployees={[]} // Would need to fetch employee data
            />
          )}
          {/* Project info */}
          <div className="card-gradient border-l-4 border-brand-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-400/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white text-xs">💼</span>
                <h3 className="font-semibold text-lg">{project.title}</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.required_skills.map((s) => <SkillBadge key={s} skill={s} />)}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                  <span>📅</span> {project.required_experience}+ years required
                </span>
              </div>
            </div>
          </div>

          {/* Stacked bar chart */}
          {chartData.length > 0 && (
            <div className="card-gradient relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
              <h3 className="font-semibold mb-4 flex items-center gap-2 relative z-10">
                <span className="w-6 h-6 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center text-white text-xs">📊</span>
                Score Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="Embedding" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Skill Cov." fill="#22c55e" stackId="a" />
                  <Bar dataKey="Experience" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="Balance" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100 text-xs">
                {[
                  { color: 'bg-gradient-to-br from-blue-400 to-blue-600', label: 'Embedding (40%)' },
                  { color: 'bg-gradient-to-br from-green-400 to-green-600', label: 'Skill Coverage (30%)' },
                  { color: 'bg-gradient-to-br from-amber-400 to-amber-600', label: 'Experience (20%)' },
                  { color: 'bg-gradient-to-br from-violet-400 to-violet-600', label: 'Team Balance (10%)' },
                ].map((i) => (
                  <span key={i.label} className="flex items-center gap-1.5 font-medium text-gray-600">
                    <span className={`w-3 h-3 rounded-sm shadow-sm ${i.color}`} />
                    {i.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Team rank cards */}
          <div className="space-y-4">
            {filteredResults.map((team, i) => (
              <div key={team.team_id} className="card-gradient hover:shadow-xl transition-all duration-300 border-l-4 border-l-brand-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-400/5 to-transparent rounded-full -translate-y-8 translate-x-8" />
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6 relative z-10">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                      }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">{team.team_name}</h4>
                      <p className="text-xs text-gray-400">Team ID: {team.team_id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4">
                    <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-xl px-4 py-2 shadow-lg text-center">
                      <p className="text-2xl font-bold">
                        {team.match_percentage?.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-brand-100">match score</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTeamForAnalysis(
                          selectedTeamForAnalysis === team.team_id ? null : team.team_id
                        )}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                          selectedTeamForAnalysis === team.team_id 
                            ? 'bg-brand-500 text-white shadow-md' 
                            : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                        }`}
                      >
                        {selectedTeamForAnalysis === team.team_id ? '✕ Hide' : '🔍 Analysis'}
                      </button>
                      <button
                        onClick={() => navigate(`/hr/team/${team.team_id}`)}
                        className="text-xs bg-accent-100 text-accent-700 px-3.5 py-1.5 rounded-full font-medium hover:bg-accent-200 transition-colors"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                  <ScoreBar label="Embedding Similarity (40%)" value={team.embedding_similarity * 100} />
                  <ScoreBar label="Skill Coverage (30%)" value={team.skill_coverage * 100} />
                  <ScoreBar label="Experience Match (20%)" value={team.experience_match * 100} />
                  <ScoreBar label="Team Balance (10%)" value={team.team_balance * 100} />
                </div>

                {/* Detailed Match Analysis */}
                {selectedTeamForAnalysis === team.team_id && (
                  <div className="mt-6 pt-6 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-brand-50/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
                    <MatchExplanation
                      matchData={{
                        final_score: team.match_percentage / 100,
                        embedding_similarity: team.embedding_similarity,
                        skill_coverage: team.skill_coverage,
                        experience_match: team.experience_match,
                        team_balance: team.team_balance
                      }}
                      projectData={project}
                      teamData={{ team_id: team.team_id, team_name: team.team_name }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
