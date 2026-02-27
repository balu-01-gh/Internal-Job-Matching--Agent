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
        <h2 className="text-xl font-bold">Team Overview</h2>
        <select
          className="input w-44 text-sm"
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
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-700">{members.length}</p>
            <p className="text-xs text-gray-400 mt-1">Members</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-700">{avgExp}y</p>
            <p className="text-xs text-gray-400 mt-1">Avg Experience</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-700">{allSkills.length}</p>
            <p className="text-xs text-gray-400 mt-1">Unique Skills</p>
          </div>
        </div>
      )}

      {/* Member cards */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading team…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((member) => (
            <div key={member.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{member.name}</h4>
                  <p className="text-xs text-gray-400">{member.email}</p>
                  {member.role === 'team_lead' && (
                    <span className="badge bg-brand-100 text-brand-700 mt-1">Team Lead</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-700">{member.experience}y</p>
                  <p className="text-xs text-gray-400">exp.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(member.skills || []).map((s) => (
                  <SkillBadge key={s} skill={s} />
                ))}
              </div>

              {member.certifications?.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {member.certifications.map((c) => (
                      <SkillBadge key={c} skill={c} variant="gray" />
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
