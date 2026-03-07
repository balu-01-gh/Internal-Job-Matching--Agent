/**
 * teamlead/TeamOverviewPage.jsx
 * Shows the team lead's team members with skills, experience, and gaps.
 */

import React, { useEffect, useState } from 'react'
import { teamAPI, projectAPI } from '../../services/api'
import SkillBadge from '../../components/SkillBadge'
import ScoreBar from '../../components/ScoreBar'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export default function TeamOverviewPage() {
  const user = getUser()
  const [members, setMembers]     = useState([])
  const [teams, setTeams]         = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    teamAPI.list().then(({ data }) => {
      setTeams(data)
      // Auto-select the team that matches the user's team_id
      const myTeam = data.find((t) => t.team_id === user?.team_id)
      if (myTeam) loadTeam(myTeam.team_id)
      else setLoading(false)
    })
  }, [])

  async function loadTeam(teamId) {
    setLoading(true)
    setSelectedTeam(teamId)
    try {
      const { data } = await teamAPI.members(teamId)
      setMembers(data)
    } catch (e) {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Average experience
  const avgExp = members.length
    ? (members.reduce((sum, m) => sum + m.experience, 0) / members.length).toFixed(1)
    : 0

  // Union of all skills
  const allSkills = [...new Set(members.flatMap((m) => m.skills || []))]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">👥</span>
          <span className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Team Overview</span>
        </h2>
        <select
          className="input w-48 text-sm bg-white"
          value={selectedTeam || ''}
          onChange={(e) => loadTeam(Number(e.target.value))}
        >
          <option value="">Select team</option>
          {teams.map((t) => (
            <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      {selectedTeam && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card-gradient text-center relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
            <div className="relative z-10">
              <p className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">{members.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Members</p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="card-gradient text-center relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent" />
            <div className="relative z-10">
              <p className="text-3xl font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">{avgExp}y</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Avg Experience</p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-accent-400 to-accent-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="card-gradient text-center relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-success-500/5 to-transparent" />
            <div className="relative z-10">
              <p className="text-3xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">{allSkills.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Unique Skills</p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-success-400 to-success-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* Member cards */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Loading team members...
        </div>
      ) : members.length === 0 ? (
        <div className="card-gradient text-center py-12">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-gray-500 dark:text-gray-400">No team members found. Select a team to view members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((member, i) => (
            <div key={member.id} className="card-gradient hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-400/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
              
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold shadow-md">
                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="font-semibold group-hover:text-brand-700 transition-colors">{member.name}</h4>
                    <p className="text-xs text-gray-400">{member.email}</p>
                    {member.role === 'team_lead' && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700 text-xs px-2 py-0.5 rounded-full mt-1 font-medium">
                        <span>⭐</span> Team Lead
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-3 py-1.5 rounded-xl shadow-md">
                    <p className="text-lg font-bold">{member.experience}y</p>
                    <p className="text-xs text-brand-100">exp.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(member.skills || []).map((s) => (
                  <SkillBadge key={s} skill={s} />
                ))}
              </div>

              {member.certifications?.length > 0 && (
                <div className="pt-3 border-t border-gray-100/80">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-4 bg-warning-100 rounded-full flex items-center justify-center text-warning-600 text-[10px]">🏆</span>
                    Certifications
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.certifications.map((c) => (
                      <SkillBadge key={c} skill={c} variant="accent" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
