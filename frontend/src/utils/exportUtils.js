/**
 * exportUtils.js - CSV and data export utilities
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV(data, headers) {
  if (!Array.isArray(data) || data.length === 0) return ''

  // Create header row
  const headerRow = headers.join(',')
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.toLowerCase().replace(/\s+/g, '_')] || ''
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""')
      return escaped.includes(',') ? `"${escaped}"` : escaped
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csv, fileName = 'export.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export projects data
 */
export function exportProjectsToCSV(projects) {
  const headers = ['Project ID', 'Title', 'Description', 'Required Skills', 'Required Experience', 'Status']
  const data = projects.map(p => ({
    project_id: p.id || p.project_id,
    title: p.title,
    description: p.description,
    required_skills: (p.required_skills || []).join('; '),
    required_experience: p.required_experience,
    status: p.status || 'Active'
  }))

  const csv = convertToCSV(data, headers)
  downloadCSV(csv, `projects_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export teams data
 */
export function exportTeamsToCSV(teams) {
  const headers = ['Team ID', 'Team Name', 'Members', 'Avg Experience', 'Skills']
  const data = teams.map(t => ({
    team_id: t.id || t.team_id,
    team_name: t.team_name,
    members: t.members?.length || 0,
    avg_experience: t.members?.length ? (t.members.reduce((s, m) => s + m.experience, 0) / t.members.length).toFixed(1) : 0,
    skills: Array.from(new Set(t.members?.flatMap(m => m.skills || []) || [])).join('; ')
  }))

  const csv = convertToCSV(data, headers)
  downloadCSV(csv, `teams_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export match results
 */
export function exportMatchResultsToCSV(results, projectTitle) {
  const headers = ['Rank', 'Team Name', 'Match Score', 'Embedding', 'Skill Coverage', 'Experience Match', 'Team Balance']
  const data = results.map((r, i) => ({
    rank: i + 1,
    team_name: r.team_name,
    match_score: `${(r.match_percentage || 0).toFixed(1)}%`,
    embedding: `${(r.embedding_similarity * 100).toFixed(1)}%`,
    skill_coverage: `${(r.skill_coverage * 100).toFixed(1)}%`,
    experience_match: `${(r.experience_match * 100).toFixed(1)}%`,
    team_balance: `${(r.team_balance * 100).toFixed(1)}%`
  }))

  const csv = convertToCSV(data, headers)
  downloadCSV(csv, `matches_${projectTitle || 'results'}_${new Date().toISOString().split('T')[0]}.csv`)
}
