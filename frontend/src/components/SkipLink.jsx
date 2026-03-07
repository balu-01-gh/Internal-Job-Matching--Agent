/**
 * SkipLink.jsx - Accessible skip navigation link
 * Allows keyboard users to skip to main content
 */

import React from 'react'

export default function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }) {
  const handleClick = (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600 transition-all"
    >
      {children}
    </a>
  )
}

/**
 * SkipLinks component for multiple skip targets
 */
export function SkipLinks({ links }) {
  if (!links || links.length === 0) {
    return <SkipLink />
  }

  return (
    <div className="skip-links-container">
      {links.map((link, index) => (
        <SkipLink key={index} targetId={link.targetId}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  )
}
