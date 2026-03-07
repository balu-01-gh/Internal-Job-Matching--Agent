/**
 * AssignmentHistory.jsx - Display and manage assignment history and status
 */

import React, { useState } from 'react'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-success-100 text-success-800',
  cancelled: 'bg-danger-100 text-danger-800',
}

const STATUS_ICONS = {
  draft: '📝',
  pending: '⏳',
  approved: '✓',
  active: '▶',
  completed: '✓✓',
  cancelled: '✕',
}

export default function AssignmentHistory({ 
  assignments = [], 
  onApprove = () => {},
  onCancel = () => {},
  onViewDetails = () => {},
  isLoading = false,
  currentUserRole = 'hr'
}) {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('startDate')

  const filteredAssignments = selectedStatus === 'all'
    ? assignments
    : assignments.filter(a => a.status === selectedStatus)

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (sortBy === 'startDate') {
      return new Date(b.startDate) - new Date(a.startDate)
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status)
    }
    return 0
  })

  const getProgressPercentage = (assignment) => {
    const start = new Date(assignment.startDate)
    const end = new Date(assignment.endDate)
    const now = new Date()

    if (now < start) return 0
    if (now > end) return 100

    const total = end - start
    const elapsed = now - start
    return Math.round((elapsed / total) * 100)
  }

  const canApprove = (assignment) => {
    return assignment.status === 'pending' && currentUserRole === 'hr'
  }

  const canCancel = (assignment) => {
    return ['draft', 'pending', 'approved', 'active'].includes(assignment.status)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'active', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedStatus === status
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="startDate">Sort by Date</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {sortedAssignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No assignments found</p>
          </div>
        ) : (
          sortedAssignments.map((assignment) => {
            const progress = getProgressPercentage(assignment)
            const startDate = new Date(assignment.startDate).toLocaleDateString()
            const endDate = new Date(assignment.endDate).toLocaleDateString()

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {assignment.teamName} → {assignment.projectName}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${STATUS_COLORS[assignment.status]}`}>
                        {STATUS_ICONS[assignment.status]} {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {assignment.role && `${assignment.role} • `}
                      {startDate} to {endDate}
                    </p>

                    {/* Progress bar for active assignments */}
                    {assignment.status === 'active' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Assignment metadata */}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {assignment.duration && (
                        <span>⏱ {assignment.duration} days</span>
                      )}
                      {assignment.allocatedBudget > 0 && (
                        <span>💰 ${assignment.allocatedBudget.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(assignment)}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Details
                    </button>

                    {canApprove(assignment) && (
                      <button
                        onClick={() => onApprove(assignment.id)}
                        className="px-3 py-1.5 text-sm bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                      >
                        Approve
                      </button>
                    )}

                    {canCancel(assignment) && (
                      <button
                        onClick={() => onCancel(assignment.id)}
                        className="px-3 py-1.5 text-sm bg-danger-100 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400 rounded-lg hover:bg-danger-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignment notes */}
                {assignment.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Notes:</span> {assignment.notes}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Summary stats */}
      {sortedAssignments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {[
            { label: 'Total Assignments', value: assignments.length },
            { label: 'Active', value: assignments.filter(a => a.status === 'active').length },
            { label: 'Pending Approval', value: assignments.filter(a => a.status === 'pending').length },
            { label: 'Completed', value: assignments.filter(a => a.status === 'completed').length },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center"
            >
              <p className="text-2xl font-bold text-brand-600">{stat.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
