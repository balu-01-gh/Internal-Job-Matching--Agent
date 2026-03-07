/**
 * ReportExport.jsx - Export system for various HR reports
 */

import React, { useState } from 'react'

const REPORT_TYPES = {
  team_performance: {
    name: 'Team Performance Report',
    description: 'Detailed analysis of team matching scores and project outcomes',
    formats: ['PDF', 'Excel', 'CSV']
  },
  skill_analysis: {
    name: 'Skill Gap Analysis',
    description: 'Organization-wide skill inventory and gap identification',
    formats: ['PDF', 'Excel']
  },
  project_summary: {
    name: 'Project Summary Report',
    description: 'Complete project lifecycle with team assignments and results',
    formats: ['PDF', 'Word', 'Excel']
  },
  employee_roster: {
    name: 'Employee Roster',
    description: 'Complete employee directory with skills and experience',
    formats: ['Excel', 'CSV', 'PDF']
  },
  matching_analytics: {
    name: 'Matching Analytics',
    description: 'AI matching performance metrics and trends',
    formats: ['PDF', 'Excel']
  },
  feedback_summary: {
    name: 'Feedback Summary',
    description: 'Compiled feedback from completed projects',
    formats: ['PDF', 'Excel']
  }
}

const FORMAT_ICONS = {
  PDF: '📄',
  Excel: '📊', 
  Word: '📝',
  CSV: '📋'
}

export default function ReportExport({ onExport }) {
  const [selectedReport, setSelectedReport] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  })
  const [filters, setFilters] = useState({
    includeArchived: false,
    teamFilter: 'all',
    projectStatus: 'all',
    minScore: 0
  })
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!selectedReport || !selectedFormat) return

    setExporting(true)
    try {
      const exportData = {
        reportType: selectedReport,
        format: selectedFormat,
        dateRange,
        filters,
        timestamp: new Date().toISOString()
      }

      // In real app, this would call the backend API
      await onExport?.(exportData)
      
      // Mock export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock download
      const mockContent = generateMockReport(exportData)
      downloadFile(mockContent, `${selectedReport}_${new Date().toISOString().split('T')[0]}.${selectedFormat.toLowerCase()}`)
      
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const generateMockReport = (exportData) => {
    const { reportType, format } = exportData
    
    if (format === 'CSV') {
      return `Report Type,${reportType}\nGenerated,${new Date().toLocaleString()}\nDate Range,${dateRange.start} to ${dateRange.end}\n\nSample data would go here...`
    }
    
    return JSON.stringify(exportData, null, 2) // Mock data
  }

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const selectedReportData = selectedReport ? REPORT_TYPES[selectedReport] : null

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Export Reports</h3>
      
      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(REPORT_TYPES).map(([key, report]) => (
              <div
                key={key}
                onClick={() => setSelectedReport(key)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedReport === key
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-gray-800">{report.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-gray-500">Formats:</span>
                  {report.formats.map(format => (
                    <span key={format} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {FORMAT_ICONS[format]} {format}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        {selectedReportData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="flex gap-3">
              {selectedReportData.formats.map(format => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    selectedFormat === format
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="mr-2">{FORMAT_ICONS[format]}</span>
                  {format}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Additional Filters
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeArchived}
                  onChange={(e) => setFilters({ ...filters, includeArchived: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm text-gray-700">Include archived items</span>
              </label>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Team Filter</label>
              <select
                value={filters.teamFilter}
                onChange={(e) => setFilters({ ...filters, teamFilter: e.target.value })}
                className="input w-full"
              >
                <option value="all">All Teams</option>
                <option value="active">Active Teams Only</option>
                <option value="high_performance">High Performance Teams</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Project Status</label>
              <select
                value={filters.projectStatus}
                onChange={(e) => setFilters({ ...filters, projectStatus: e.target.value })}
                className="input w-full"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Minimum Match Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })}
                className="input w-full"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={!selectedReport || !selectedFormat || exporting}
            className="btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Generating Report...
              </span>
            ) : (
              `Export ${selectedFormat || 'Report'}`
            )}
          </button>
          
          {selectedReport && selectedFormat && (
            <p className="text-sm text-gray-600 mt-2">
              This will generate a {selectedFormat} file containing {REPORT_TYPES[selectedReport].name.toLowerCase()}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}