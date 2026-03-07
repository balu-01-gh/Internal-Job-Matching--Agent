/**
 * SkillHeatmap.jsx - Interactive team skill heatmap visualization
 */

import React from 'react'

const SKILL_COLORS = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500', 
  low: 'bg-red-500',
  none: 'bg-gray-200'
}

function getSkillLevel(employee, skill) {
  const empSkills = (employee.skills || []).map(s => s.toLowerCase())
  if (empSkills.includes(skill.toLowerCase())) {
    // Could enhance based on experience level
    return employee.experience > 4 ? 'high' : 'medium'
  }
  return 'none'
}

export default function SkillHeatmap({ teamData }) {
  if (!teamData?.employees?.length) {
    return <div className="text-gray-500">No team data available</div>
  }

  const { employees, all_skills } = teamData

  return (
    <div className="overflow-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">
              Employee
            </th>
            {all_skills.map(skill => (
              <th key={skill} className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-b transform -rotate-45 origin-bottom-left">
                <div className="w-20 h-6 flex items-end justify-center">
                  {skill}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 text-sm font-medium text-gray-900 border-r">
                {emp.employee_name}
              </td>
              {all_skills.map(skill => {
                const level = getSkillLevel(emp, skill)
                return (
                  <td key={skill} className="px-2 py-2 text-center border-r">
                    <div 
                      className={`w-6 h-6 rounded-full mx-auto ${SKILL_COLORS[level]}`}
                      title={`${emp.employee_name} - ${skill}: ${level}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="font-medium">Skill Level:</span>
        {Object.entries(SKILL_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded-full ${color}`} />
            <span className="capitalize">{level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}