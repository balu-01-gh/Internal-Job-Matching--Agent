/**
 * Layout.jsx - Shared navbar + sidebar shell for authenticated pages.
 */

import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { parseJwt } from '../utils/jwt'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

function getHRId() {
  const token = localStorage.getItem('token')
  const payload = parseJwt(token)
  return payload?.hr_id || null
}

const NAV_LINKS = {
  employee: [
    { label: 'Dashboard', to: '/employee/dashboard' },
    { label: 'Skill Gap', to: '/employee/skill-gap' },
  ],
  team_lead: [
    { label: 'Team Overview', to: '/team-lead/overview' },
    { label: 'Skill Heatmap', to: '/team-lead/heatmap' },
  ],
  hr: [
    { label: 'Add Project', to: '/hr/add-project' },
  ],
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const hrId = getHRId()

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  const links = (user && NAV_LINKS[user.role]) || []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-brand-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">KLH Match</span>
          <span className="text-brand-100 text-xs uppercase tracking-widest">
            {user?.role?.replace('_', ' ')}
          </span>
          {hrId && (
            <span className="ml-4 px-2 py-1 bg-brand-900/30 rounded text-xs font-mono">HR: {hrId}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-brand-100">{user?.name}</span>
          <button
            onClick={logout}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-gray-200 pt-6 px-3">
          <nav className="space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
