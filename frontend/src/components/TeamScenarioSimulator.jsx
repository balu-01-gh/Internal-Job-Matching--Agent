/**
 * TeamScenarioSimulator.jsx - "What-if" scenario testing for team compositions
 */

import React, { useState, useEffect } from 'react'
import { hrAPI } from '../services/api'

export default function TeamScenarioSimulator({ projectId, allEmployees = [] }) {
  const [selectedMembers, setSelectedMembers] = useState([])
  const [simulationResult, setSimulationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState([])

  useEffect(() => {
    setAvailableEmployees(allEmployees.filter(emp => 
      !selectedMembers.find(selected => selected.id === emp.id)
    ))
  }, [selectedMembers, allEmployees])

  const addMember = (employee) => {
    setSelectedMembers([...selectedMembers, employee])
  }

  const removeMember = (employeeId) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== employeeId))
  }

  const runSimulation = async () => {
    if (selectedMembers.length === 0) return

    setLoading(true)
    try {
      // Simulate team composition by calculating scores client-side
      // In a real implementation, you'd send this to the backend
      const teamSkills = [...new Set(selectedMembers.flatMap(m => m.skills || []))]
      const avgExperience = selectedMembers.reduce((sum, m) => sum + (m.experience || 0), 0) / selectedMembers.length
      
      // Mock simulation result - in real app, call backend API
      const mockResult = {
        simulatedScore: 0.65 + Math.random() * 0.3, // Random score for demo
        skillCoverage: teamSkills.length / 10, // Mock calculation
        experienceMatch: Math.min(avgExperience / 5, 1),
        teamBalance: selectedMembers.length >= 3 ? 0.8 : 0.5,
        recommendations: generateRecommendations(teamSkills, avgExperience, selectedMembers.length)
      }
      
      setSimulationResult(mockResult)
    } catch (error) {
      console.error('Simulation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = (skills, avgExp, teamSize) => {
    const recs = []
    
    if (teamSize < 3) {
      recs.push('Consider adding more team members for better collaboration')
    }
    
    if (avgExp < 3) {
      recs.push('Team may benefit from senior developer mentorship')
    }
    
    if (!skills.includes('React') && !skills.includes('Frontend')) {
      recs.push('Missing frontend expertise - consider adding UI/UX specialists')
    }
    
    if (!skills.includes('Python') && !skills.includes('Backend')) {
      recs.push('Backend development skills may be needed')
    }
    
    return recs
  }

  const resetSimulation = () => {
    setSelectedMembers([])
    setSimulationResult(null)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Team Scenario Simulator</h3>
        <button 
          onClick={resetSimulation}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Selection */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Available Employees</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableEmployees.map(employee => (
              <div 
                key={employee.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">{employee.name}</div>
                  <div className="text-xs text-gray-600">
                    {employee.experience}y exp • {(employee.skills || []).slice(0, 3).join(', ')}
                  </div>
                </div>
                <button 
                  onClick={() => addMember(employee)}
                  className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Team */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">
            Simulated Team ({selectedMembers.length} members)
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {selectedMembers.map(member => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded"
              >
                <div>
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="text-xs text-gray-600">
                    {member.experience}y exp • {(member.skills || []).slice(0, 3).join(', ')}
                  </div>
                </div>
                <button 
                  onClick={() => removeMember(member.id)}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            {selectedMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Add employees to simulate team composition
              </div>
            )}
          </div>

          <button 
            onClick={runSimulation}
            disabled={selectedMembers.length === 0 || loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Simulation...' : 'Simulate Team Performance'}
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-4">Simulation Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-600">
                {Math.round(simulationResult.simulatedScore * 100)}%
              </div>
              <div className="text-sm text-gray-600">Overall Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(simulationResult.skillCoverage * 100)}%
              </div>
              <div className="text-sm text-gray-600">Skill Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(simulationResult.experienceMatch * 100)}%
              </div>
              <div className="text-sm text-gray-600">Experience Match</div>
            </div>
          </div>

          {simulationResult.recommendations.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Recommendations:</h5>
              <ul className="list-disc list-inside space-y-1">
                {simulationResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}