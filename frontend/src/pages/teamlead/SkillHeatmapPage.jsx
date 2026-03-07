/**
 * teamlead/SkillHeatmapPage.jsx
 * Visual heatmap of which team members have which skills.
 * Uses a grid: rows = skills, columns = members.
 */

import React, { useEffect, useState } from 'react'
import { teamAPI } from '../../services/api'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export default function SkillHeatmapPage() {
  const user = getUser()
  const [teams, setTeams]           = useState([])
  const [selectedTeam, setSelected] = useState(null)
  const [heatmap, setHeatmap]       = useState(null)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    teamAPI.list().then(({ data }) => {
      setTeams(data)
      const myTeam = data.find((t) => t.team_id === user?.team_id)
      if (myTeam) loadHeatmap(myTeam.team_id)
    })
  }, [])

  async function loadHeatmap(teamId) {
    setLoading(true)
    setSelected(teamId)
    try {
      const { data } = await teamAPI.heatmap(teamId)
      setHeatmap(data)
    } catch {
      setHeatmap(null)
    } finally {
      setLoading(false)
    }
  }

  function hasSkill(employeeSkills, skill) {
    return employeeSkills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Skill Heatmap</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Green = skill present · Gray = skill missing
          </p>
        </div>
        <select
          className="input w-44 text-sm"
          value={selectedTeam || ''}
          onChange={(e) => loadHeatmap(Number(e.target.value))}
        >
          <option value="">Select team</option>
          {teams.map((t) => (
            <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading heatmap…</p>}

      {!loading && heatmap && (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium w-40">Skill</th>
                {heatmap.employees.map((emp) => (
                  <th key={emp.employee_name} className="text-center py-2 px-2 text-gray-700 font-semibold whitespace-nowrap">
                    {emp.employee_name.split(' ')[0]}
                  </th>
                ))}
                <th className="text-center py-2 px-2 text-gray-500 font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.all_skills.map((skill) => {
                const count = heatmap.employees.filter((e) =>
                  hasSkill(e.skills, skill)
                ).length
                const pct = Math.round((count / heatmap.employees.length) * 100)

                return (
                  <tr key={skill} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 pr-4 font-medium text-gray-700 capitalize">{skill}</td>
                    {heatmap.employees.map((emp) => (
                      <td key={emp.employee_name} className="text-center py-1.5 px-2">
                        {hasSkill(emp.skills, skill) ? (
                          <span className="inline-block w-5 h-5 rounded bg-green-400" title="Has skill" />
                        ) : (
                          <span className="inline-block w-5 h-5 rounded bg-gray-200" title="Missing" />
                        )}
                      </td>
                    ))}
                    <td className="text-center py-1.5 px-2">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !heatmap && selectedTeam && (
        <p className="text-gray-400 text-sm">No data available for this team.</p>
      )}
    </div>
  )
}
