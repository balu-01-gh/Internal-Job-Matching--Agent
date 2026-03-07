/**
 * ScoreBar.jsx - Animated percentage progress bar for match scores.
 */

import React from 'react'

function colorForScore(pct) {
  if (pct >= 75) return 'bg-gradient-to-r from-success-400 to-success-500'
  if (pct >= 50) return 'bg-gradient-to-r from-warning-400 to-warning-500'
  if (pct >= 25) return 'bg-gradient-to-r from-orange-400 to-orange-500'
  return 'bg-gradient-to-r from-danger-400 to-danger-500'
}

function textColorForScore(pct) {
  if (pct >= 75) return 'text-success-600'
  if (pct >= 50) return 'text-warning-600'
  if (pct >= 25) return 'text-orange-600'
  return 'text-danger-600'
}

export default function ScoreBar({ label, value, max = 100, showPct = true }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  const color = colorForScore(pct)
  const textColor = textColorForScore(pct)

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1.5 text-xs">
          <span className="text-gray-600 font-medium">{label}</span>
          {showPct && <span className={`font-bold ${textColor}`}>{pct}%</span>}
        </div>
      )}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
