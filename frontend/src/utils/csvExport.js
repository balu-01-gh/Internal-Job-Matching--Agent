/**
 * csvExport.js - CSV export utilities
 */

/**
 * Convert an array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {String} filename - Output filename
 * @param {Array} excludeColumns - Columns to exclude from export
 */
export function exportToCSV(data, filename = 'export.csv', excludeColumns = []) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get all unique keys from objects
  const allKeys = new Set()
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key))
  })

  const headers = Array.from(allKeys).filter(key => !excludeColumns.includes(key))

  // Create CSV headers with proper escaping
  const csvHeaders = headers.map(header => escapeCSVValue(header)).join(',')

  // Create CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      return escapeCSVValue(value)
    }).join(',')
  })

  const csv = [csvHeaders, ...csvRows].join('\n')
  downloadCSVFile(csv, filename)
}

/**
 * Export a 2D array to CSV
 * @param {Array} headers - Column headers
 * @param {Array<Array>} rows - Data rows
 * @param {String} filename - Output filename
 */
export function exportTable(headers, rows, filename = 'export.csv') {
  const csvHeaders = headers.map(h => escapeCSVValue(h)).join(',')
  const csvRows = rows.map(row => {
    return row.map(cell => escapeCSVValue(cell)).join(',')
  })

  const csv = [csvHeaders, ...csvRows].join('\n')
  downloadCSVFile(csv, filename)
}

/**
 * Export employees with selected columns
 * @param {Array} employees - Employee data
 * @param {Array} selectedColumns - Columns to include
 * @param {String} filename - Output filename
 */
export function exportEmployees(employees, selectedColumns = ['name', 'email', 'role', 'skills'], filename = 'employees.csv') {
  const data = employees.map(emp => {
    const row = {}
    selectedColumns.forEach(col => {
      if (col === 'skills' && Array.isArray(emp.skills)) {
        row[col] = emp.skills.join('; ')
      } else {
        row[col] = emp[col] || ''
      }
    })
    return row
  })

  exportToCSV(data, filename)
}

/**
 * Export projects with selected columns
 * @param {Array} projects - Project data
 * @param {Array} selectedColumns - Columns to include
 * @param {String} filename - Output filename
 */
export function exportProjects(projects, selectedColumns = ['name', 'description', 'status', 'startDate', 'endDate'], filename = 'projects.csv') {
  const data = projects.map(proj => {
    const row = {}
    selectedColumns.forEach(col => {
      if (col === 'requiredSkills' && Array.isArray(proj.requiredSkills)) {
        row[col] = proj.requiredSkills.join('; ')
      } else {
        row[col] = proj[col] || ''
      }
    })
    return row
  })

  exportToCSV(data, filename)
}

/**
 * Export team assignments
 * @param {Array} assignments - Assignment data
 * @param {String} filename - Output filename
 */
export function exportTeamAssignments(assignments, filename = 'team_assignments.csv') {
  const headers = ['Employee Name', 'Project Name', 'Role', 'Match Score', 'Status', 'Start Date', 'End Date']
  const rows = assignments.map(assignment => [
    assignment.employeeName || '',
    assignment.projectName || '',
    assignment.role || '',
    assignment.matchScore ? `${assignment.matchScore}%` : '',
    assignment.status || '',
    assignment.startDate || '',
    assignment.endDate || ''
  ])

  exportTable(headers, rows, filename)
}

/**
 * Export skill matrix/heatmap
 * @param {Array} employees - Employee data
 * @param {Array} skills - Skill list
 * @param {String} filename - Output filename
 */
export function exportSkillMatrix(employees, skills, filename = 'skill_matrix.csv') {
  const headers = ['Employee', ...skills]
  const rows = employees.map(emp => {
    const row = [emp.name || emp.id]
    skills.forEach(skill => {
      const proficiency = emp.skillProficiency?.[skill] || ''
      row.push(proficiency)
    })
    return row
  })

  exportTable(headers, rows, filename)
}

/**
 * Export team performance report
 * @param {Array} teams - Team data
 * @param {String} filename - Output filename
 */
export function exportTeamPerformance(teams, filename = 'team_performance.csv') {
  const headers = ['Team Name', 'Members Count', 'Average Match Score', 'Projects Completed', 'Active Projects', 'Status']
  const rows = teams.map(team => [
    team.name || '',
    team.memberCount || 0,
    team.avgMatchScore ? `${team.avgMatchScore.toFixed(1)}%` : '',
    team.completedProjects || 0,
    team.activeProjects || 0,
    team.status || ''
  ])

  exportTable(headers, rows, filename)
}

/**
 * Escape CSV values to handle special characters
 * @param {*} value - Value to escape
 * @returns {String} Escaped value
 */
export function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // If the value contains comma, newline, or quotes, wrap it in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Download a CSV file
 * @param {String} csv - CSV content
 * @param {String} filename - Output filename
 */
function downloadCSVFile(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Create a CSV export with header information
 * @param {Object} headerInfo - Header metadata (title, date, etc.)
 * @param {Array} data - Data to export
 * @param {String} filename - Output filename
 */
export function exportWithHeader(headerInfo, data, filename = 'export.csv') {
  const headerRows = []

  if (headerInfo.title) {
    headerRows.push(`Title,${escapeCSVValue(headerInfo.title)}`)
  }

  if (headerInfo.generatedDate !== false) {
    headerRows.push(`Generated,${new Date().toLocaleString()}`)
  }

  if (headerInfo.dateRange) {
    headerRows.push(`Date Range,${headerInfo.dateRange}`)
  }

  if (headerInfo.notes) {
    headerRows.push(`Notes,${escapeCSVValue(headerInfo.notes)}`)
  }

  // Add blank line separator
  if (headerRows.length > 0) {
    headerRows.push('')
  }

  // Get all unique keys from data objects
  const allKeys = new Set()
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key))
  })

  const headers = Array.from(allKeys)
  const csvHeaders = headers.map(h => escapeCSVValue(h)).join(',')

  const csvRows = data.map(row => {
    return headers.map(header => escapeCSVValue(row[header])).join(',')
  })

  const csv = [...headerRows, csvHeaders, ...csvRows].join('\n')
  downloadCSVFile(csv, filename)
}
