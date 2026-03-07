import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { GoogleAuthCallback } from './components/GoogleSignIn'
import Layout from './components/Layout'
import ToastContainer from './components/ToastContainer'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'

// ── Lazy-loaded pages ─────────────────────────────────────────
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const SignupPage = React.lazy(() => import('./pages/SignupPage'))
const ResumeUploadPage = React.lazy(() => import('./pages/employee/ResumeUploadPage'))
const EmployeeDashboard = React.lazy(() => import('./pages/employee/Dashboard'))
const SkillGapPage = React.lazy(() => import('./pages/employee/SkillGapPage'))
const TeamOverviewPage = React.lazy(() => import('./pages/teamlead/TeamOverviewPage'))
const SkillHeatmapPage = React.lazy(() => import('./pages/teamlead/SkillHeatmapPage'))
const AddProjectPage = React.lazy(() => import('./pages/hr/AddProjectPage'))
const RankTeamsPage = React.lazy(() => import('./pages/hr/RankTeamsPage'))
const TeamDetailsPage = React.lazy(() => import('./pages/hr/TeamDetailsPage'))

// ── Page loading fallback ─────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    </div>
  )
}

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
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

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
            </Suspense>
            <ToastContainer />
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
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
