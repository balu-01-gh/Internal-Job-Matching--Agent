import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreBar from '../components/ScoreBar'

describe('ScoreBar', () => {
  it('renders the label', () => {
    render(<ScoreBar label="Skill Match" value={80} />)
    expect(screen.getByText('Skill Match')).toBeInTheDocument()
  })

  it('shows the correct percentage', () => {
    render(<ScoreBar label="Score" value={75} max={100} showPct />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('clamps percentage at 100', () => {
    render(<ScoreBar label="Score" value={150} max={100} showPct />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('hides percentage when showPct is false', () => {
    render(<ScoreBar label="Score" value={60} showPct={false} />)
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('renders without a label', () => {
    const { container } = render(<ScoreBar value={50} />)
    expect(container.querySelector('.w-full')).toBeInTheDocument()
  })
})
