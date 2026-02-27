/**
 * SkillBadge.jsx - Pill badge for a single skill.
 * variant: 'default' | 'green' (covered) | 'red' (missing)
 */

import React from 'react'

const VARIANTS = {
  default: 'bg-brand-50 text-brand-700 border border-brand-200',
  green:   'bg-green-50 text-green-700 border border-green-200',
  red:     'bg-red-50 text-red-700 border border-red-200',
  gray:    'bg-gray-100 text-gray-600 border border-gray-200',
}

export default function SkillBadge({ skill, variant = 'default' }) {
  return (
    <span className={`badge text-xs px-2 py-0.5 rounded-full font-medium ${VARIANTS[variant]}`}>
      {skill}
    </span>
  )
}
