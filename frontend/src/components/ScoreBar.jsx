/**
 * ScoreBar.jsx - Animated percentage progress bar for match scores.
 */

import React from 'react'

function colorForScore(pct) {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  if (pct >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function ScoreBar({ label, value, max = 100, showPct = true }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  const color = colorForScore(pct)

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-xs text-gray-500">
          <span>{label}</span>
          {showPct && <span className="font-semibold">{pct}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
