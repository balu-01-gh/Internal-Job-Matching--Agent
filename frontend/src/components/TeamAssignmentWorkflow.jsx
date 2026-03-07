/**
 * TeamAssignmentWorkflow.jsx - Team assignment workflow with multi-step form
 */

import React, { useState } from 'react'
import { useToast } from '../context/ToastContext'

const ASSIGNMENT_STATUS = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const WORKFLOW_STEPS = [
  { id: 1, label: 'Select Team', icon: '👥' },
  { id: 2, label: 'Choose Project', icon: '📋' },
  { id: 3, label: 'Set Duration', icon: '📅' },
  { id: 4, label: 'Review & Assign', icon: '✓' },
]

export default function TeamAssignmentWorkflow({ 
  teams = [], 
  projects = [], 
  onAssign = () => {},
  onCancel = () => {},
  initialData = null
}) {
  const { success, error } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState(
    initialData || {
      teamId: '',
      projectId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      role: '',
      notes: '',
      requiresApproval: true,
      allocatedBudget: 0,
    }
  )

  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  const handleTeamSelect = (teamId) => {
    setFormData({ ...formData, teamId })
    const team = teams.find(t => t.id === teamId)
    setSelectedTeam(team)
    setCurrentStep(2)
  }

  const handleProjectSelect = (projectId) => {
    setFormData({ ...formData, projectId })
    const project = projects.find(p => p.id === projectId)
    setSelectedProject(project)
    setCurrentStep(3)
  }

  const handleDateChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  }

  const handleProceedToReview = () => {
    if (!formData.startDate || !formData.endDate) {
      error('Please set both start and end dates')
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      error('End date must be after start date')
      return
    }

    setCurrentStep(4)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onAssign({
        ...formData,
        duration: calculateDuration(),
        status: formData.requiresApproval ? 'pending' : 'approved',
      })
      success(`Team assignment created successfully`)
      resetForm()
    } catch (err) {
      error(err.message || 'Failed to create assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      teamId: '',
      projectId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      role: '',
      notes: '',
      requiresApproval: true,
      allocatedBudget: 0,
    })
    setCurrentStep(1)
    setSelectedTeam(null)
    setSelectedProject(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1"
              onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                  transition-all duration-200 cursor-pointer
                  ${
                    step.id < currentStep
                      ? 'bg-success-500 text-white'
                      : step.id === currentStep
                      ? 'bg-brand-500 text-white ring-2 ring-brand-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }
                `}
              >
                {step.id < currentStep ? '✓' : step.icon}
              </div>
              <span className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                {step.label}
              </span>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Select Team */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Select Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => handleTeamSelect(team.id)}
                className={`
                  p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                  ${
                    formData.teamId === team.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                  }
                `}
              >
                <h4 className="font-semibold text-gray-800 dark:text-white">{team.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {team.memberCount || 0} members
                </p>
                <div className="mt-2 flex gap-1">
                  {team.tags?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose Project */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Choose Project</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assigning: <span className="font-semibold">{selectedTeam?.name}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectSelect(project.id)}
                className={`
                  p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                  ${
                    formData.projectId === project.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                  }
                `}
              >
                <h4 className="font-semibold text-gray-800 dark:text-white">{project.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Match: {project.matchScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Set Duration */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Set Assignment Duration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Duration:</span> {calculateDuration()} days
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role/Position
              </label>
              <input
                type="text"
                placeholder="e.g., Senior Developer, PM"
                value={formData.role}
                onChange={(e) => handleDateChange('role', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Allocated Budget
              </label>
              <input
                type="number"
                placeholder="$0"
                value={formData.allocatedBudget}
                onChange={(e) => handleDateChange('allocatedBudget', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              placeholder="Additional notes about this assignment..."
              value={formData.notes}
              onChange={(e) => handleDateChange('notes', e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requiresApproval}
              onChange={(e) => handleDateChange('requiresApproval', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Requires manager approval before activation
            </span>
          </label>
        </div>
      )}

      {/* Step 4: Review & Assign */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Review Assignment</h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Team</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedTeam?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Project</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedProject?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-800 dark:text-white">{calculateDuration()} days</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Role</p>
                <p className="font-semibold text-gray-800 dark:text-white">{formData.role || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {formData.requiresApproval ? '⏳ Pending Approval' : '✓ Ready to Activate'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Budget</p>
                <p className="font-semibold text-gray-800 dark:text-white">${formData.allocatedBudget}</p>
              </div>
            </div>

            {formData.notes && (
              <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{formData.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between gap-3">
        <button
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep(currentStep - 1)}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>

        <button
          onClick={currentStep === 3 ? handleProceedToReview : () => setCurrentStep(currentStep + 1)}
          disabled={
            (currentStep === 1 && !formData.teamId) ||
            (currentStep === 2 && !formData.projectId)
          }
          className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 3 ? 'Review' : currentStep === 4 ? 'Assign' : 'Next'}
        </button>

        {currentStep === 4 && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </button>
        )}
      </div>
    </div>
  )
}
