/**
 * SkillBadge.jsx - Pill badge for a single skill.
 * variant: 'default' | 'green' (covered) | 'red' (missing)
 */

import React from 'react'

const VARIANTS = {
  default: 'bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700 border border-brand-200/50 shadow-sm',
  green:   'bg-gradient-to-r from-success-100 to-success-200 text-success-700 border border-success-200/50 shadow-sm',
  red:     'bg-gradient-to-r from-danger-100 to-danger-200 text-danger-600 border border-danger-200/50 shadow-sm',
  gray:    'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-200/50 shadow-sm',
  accent:  'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700 border border-accent-200/50 shadow-sm',
  warning: 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-700 border border-warning-200/50 shadow-sm',
}

export default function SkillBadge({ skill, variant = 'default' }) {
  return (
    <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-semibold transition-transform hover:scale-105 ${VARIANTS[variant]}`}>
      {skill}
    </span>
  )
}
