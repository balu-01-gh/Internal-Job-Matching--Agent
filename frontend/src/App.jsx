import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ResumeUploadPage from './pages/employee/ResumeUploadPage'

// Employee
import EmployeeDashboard from './pages/employee/Dashboard'
import SkillGapPage from './pages/employee/SkillGapPage'

// Team Lead
import TeamOverviewPage from './pages/teamlead/TeamOverviewPage'
import SkillHeatmapPage from './pages/teamlead/SkillHeatmapPage'

// HR
import AddProjectPage from './pages/hr/AddProjectPage'
import RankTeamsPage from './pages/hr/RankTeamsPage'
import TeamDetailsPage from './pages/hr/TeamDetailsPage'

import Layout from './components/Layout'

// ── Error boundary ────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#dc2626', background: '#fff' }}>
          <h2>⚠ App crashed — check console</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.error)}</pre>
          <br />
          <button onClick={() => { localStorage.clear(); window.location.href='/login' }}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Clear session &amp; go to Login
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Auth helpers ──────────────────────────────────────────────

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

function PrivateRoute({ children, roles }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Resume upload — required after first login for employees/leads */}
        <Route path="/upload-resume" element={
          <PrivateRoute roles={['employee', 'team_lead']}>
            <ResumeUploadPage />
          </PrivateRoute>
        } />

        {/* Employee */}
        <Route path="/employee" element={
          <PrivateRoute roles={['employee', 'team_lead', 'hr']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="skill-gap" element={<SkillGapPage />} />
        </Route>

        {/* Team Lead */}
        <Route path="/team-lead" element={
          <PrivateRoute roles={['team_lead']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="overview" element={<TeamOverviewPage />} />
          <Route path="heatmap" element={<SkillHeatmapPage />} />
        </Route>

        {/* HR */}
        <Route path="/hr" element={
          <PrivateRoute roles={['hr']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="add-project" element={<AddProjectPage />} />
          <Route path="rank-teams/:projectId" element={<RankTeamsPage />} />
          <Route path="team/:teamId" element={<TeamDetailsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

function RootRedirect() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'hr') return <Navigate to="/hr/add-project" replace />
  if (!user.resume_uploaded) return <Navigate to="/upload-resume" replace />
  if (user.role === 'team_lead') return <Navigate to="/team-lead/overview" replace />
  return <Navigate to="/employee/dashboard" replace />
}
