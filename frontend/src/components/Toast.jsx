/**
 * Toast.jsx - Toast notification display component
 */

import React, { useEffect } from 'react'

const COLORS = {
  success: 'bg-gradient-to-r from-success-500 to-success-600 text-white',
  error: 'bg-gradient-to-r from-danger-500 to-danger-600 text-white',
  info: 'bg-gradient-to-r from-brand-500 to-brand-600 text-white',
  warning: 'bg-gradient-to-r from-warning-500 to-warning-600 text-white',
}

const ICONS = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠',
}

export default function Toast({ id, message, type = 'info', onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  return (
    <div className={`
      ${COLORS[type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3
      animate-slide-in-right border border-white/20 backdrop-blur-sm
      min-w-[300px] max-w-md
    `}>
      <span className="text-lg font-bold">{ICONS[type]}</span>
      <span className="flex-1 font-medium text-sm">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="hover:opacity-75 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
