/**
 * Layout.jsx - Shared navbar + sidebar shell for authenticated pages.
 */

import React, { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { parseJwt } from '../utils/jwt'
import { useTheme } from '../context/ThemeContext'
import NotificationCenter, { useNotificationCount } from './NotificationCenter'

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
    { label: 'Manage Projects', to: '/hr/add-project' },
    { label: 'Rank Teams', to: '/hr/rank-teams/1' },
  ],
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const hrId = getHRId()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationCount = useNotificationCount(user?.id)
  const notificationRef = useRef(null)

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  const links = (user && NAV_LINKS[user.role]) || []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-brand-600 via-brand-700 to-accent-600 text-white px-4 lg:px-6 py-3.5 flex items-center justify-between shadow-xl relative overflow-hidden">
        {/* Navbar background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="text-xl">🚀</span>
            </div>
            <span className="text-xl lg:text-2xl font-extrabold tracking-tight">KLH Match</span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-3 py-1.5 bg-white/15 backdrop-blur rounded-xl text-xs uppercase tracking-wider font-bold border border-white/20">
            {user?.role?.replace('_', ' ')}
          </span>
          {hrId && (
            <span className="hidden md:inline-flex items-center px-3 py-1.5 bg-accent-500/30 backdrop-blur rounded-xl text-xs font-mono border border-accent-400/30">
              🏢 HR: {hrId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 lg:gap-3 relative z-10">
          {/* Notification Badge */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 text-white hover:bg-white/10 rounded-xl transition-all duration-200 group ${showNotifications ? 'bg-white/20' : ''}`}
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} new)` : ''}`}
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] z-50 animate-scale-in shadow-2xl rounded-2xl">
                <NotificationCenter userId={user?.id} userRole={user?.role} />
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 18a6 6 0 100-12 6 6 0 000 12zM12 2v6m0 6v6m6-9h-6m6 0h-6M4.22 4.22l-4.24 4.24m9.02 0l4.24-4.24m0 16.48l-4.24-4.24m9.02 0l4.24 4.24" />
              </svg>
            ) : (
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/20">
            <div className="w-7 h-7 bg-gradient-to-br from-accent-400 to-brand-400 rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-sm font-semibold">{user?.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all duration-200 font-semibold border border-white/20 hover:border-white/30"
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-60
          bg-gradient-to-b from-white via-white to-brand-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50
          border-r border-brand-100/50 dark:border-gray-700/50 pt-6 px-4
          transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-xl
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Sidebar header */}
          <div className="mb-6 px-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Navigation</p>
          </div>
          
          <nav className="space-y-2">
            {links.map((l, i) => {
              const isActive = location.pathname === l.to
              const colors = ['from-brand-500 to-brand-600', 'from-accent-500 to-accent-600', 'from-success-500 to-success-600']
              const icons = ['📊', '🎯', '👥', '⚡']
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? `bg-gradient-to-r ${colors[i % colors.length]} text-white shadow-lg shadow-brand-500/30`
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-brand-50 hover:to-accent-50 dark:hover:from-brand-900/40 dark:hover:to-accent-900/40 hover:text-brand-700 dark:hover:text-brand-300'
                  }`}
                >
                  <span className={`text-lg transition-transform group-hover:scale-110 ${isActive ? '' : ''}`}>{icons[i]}</span>
                  {l.label}
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Sidebar decoration */}
          <div className="absolute bottom-6 left-4 right-4">
            <div className="p-4 bg-gradient-to-br from-brand-100 via-accent-100 to-brand-100 dark:from-brand-900/40 dark:via-accent-900/40 dark:to-brand-900/40 rounded-2xl border border-brand-200/50 dark:border-brand-800/30 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <p className="text-xs text-brand-700 dark:text-brand-300 font-bold">Pro Tip</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Upload your resume to get better AI-powered project matches!</p>
              <Link to="/upload-resume" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
                Upload Now <span>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto lg:ml-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
