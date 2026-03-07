/**
 * TeamFilter.jsx - Advanced filtering for HR team selection
 */

import React, { useState, useEffect } from 'react'

export default function TeamFilter({ 
  teams = [], 
  onFilterChange, 
  availableSkills = [], 
  availableExperience = [] 
}) {
  const [filters, setFilters] = useState({
    skills: [],
    minExperience: 0,
    maxExperience: 10,
    teamSize: 'any',
    availability: 'any'
  })

  const handleSkillToggle = (skill) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill]
    
    setFilters({ ...filters, skills: newSkills })
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  useEffect(() => {
    onFilterChange?.(filters)
  }, [filters])

  const resetFilters = () => {
    setFilters({
      skills: [],
      minExperience: 0,
      maxExperience: 10,
      teamSize: 'any',
      availability: 'any'
    })
  }

  return (
    <div className="card-gradient relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-400/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-7 h-7 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-sm shadow-md">🔍</span>
          Filter Teams
        </h3>
        <button 
          onClick={resetFilters}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-5 relative z-10">
        {/* Skills Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600 text-xs">🎯</span>
            Required Skills
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100">
            {availableSkills.map(skill => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${
                  filters.skills.includes(skill)
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 border-transparent text-white shadow-md scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-success-100 rounded-lg flex items-center justify-center text-success-600 text-xs">⏱️</span>
            Experience Range (years)
          </label>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <input
              type="number"
              min="0"
              max="20"
              value={filters.minExperience}
              onChange={(e) => handleFilterChange('minExperience', parseFloat(e.target.value) || 0)}
              className="input w-20 text-center bg-white"
            />
            <span className="text-gray-400 font-medium">to</span>
            <input
              type="number"
              min="0"
              max="20"
              value={filters.maxExperience}
              onChange={(e) => handleFilterChange('maxExperience', parseFloat(e.target.value) || 10)}
              className="input w-20 text-center bg-white"
            />
            <span className="text-xs text-gray-400 ml-2">years</span>
          </div>
        </div>

        {/* Team Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-xs">👥</span>
            Team Size
          </label>
          <select
            value={filters.teamSize}
            onChange={(e) => handleFilterChange('teamSize', e.target.value)}
            className="input w-full bg-white"
          >
            <option value="any">Any Size</option>
            <option value="small">Small (1-3 members)</option>
            <option value="medium">Medium (4-6 members)</option>
            <option value="large">Large (7+ members)</option>
          </select>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-warning-100 rounded-lg flex items-center justify-center text-warning-600 text-xs">🟢</span>
            Availability Status
          </label>
          <select
            value={filters.availability}
            onChange={(e) => handleFilterChange('availability', e.target.value)}
            className="input w-full bg-white"
          >
            <option value="any">Any Status</option>
            <option value="available">✔️ Available</option>
            <option value="busy">⏸️ Currently Assigned</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.skills.length > 0 || filters.teamSize !== 'any' || filters.availability !== 'any') && (
        <div className="mt-5 pt-4 border-t border-gray-100 relative z-10">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium">Active:</span>
            {filters.skills.map(skill => (
              <span key={skill} className="inline-flex items-center gap-1 bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700 px-2.5 py-1 rounded-full text-xs font-medium">
                {skill}
                <button onClick={() => handleSkillToggle(skill)} className="hover:text-danger-600">×</button>
              </span>
            ))}
            {filters.teamSize !== 'any' && (
              <span className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full text-xs font-medium">
                Size: {filters.teamSize}
              </span>
            )}
            {filters.availability !== 'any' && (
              <span className="inline-flex items-center gap-1 bg-warning-100 text-warning-700 px-2.5 py-1 rounded-full text-xs font-medium">
                {filters.availability === 'available' ? '✔️ Available' : '⏸️ Assigned'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}