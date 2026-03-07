import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkillBadge from '../components/SkillBadge'

describe('SkillBadge', () => {
  it('renders the skill name', () => {
    render(<SkillBadge skill="Python" />)
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('applies default variant class', () => {
    const { container } = render(<SkillBadge skill="React" />)
    const badge = container.querySelector('span')
    expect(badge.className).toContain('text-brand-700')
  })

  it('applies green variant class', () => {
    const { container } = render(<SkillBadge skill="FastAPI" variant="green" />)
    const badge = container.querySelector('span')
    expect(badge.className).toContain('text-success-700')
  })

  it('applies red variant class', () => {
    const { container } = render(<SkillBadge skill="Docker" variant="red" />)
    const badge = container.querySelector('span')
    expect(badge.className).toContain('text-danger-600')
  })

  it('applies gray variant class', () => {
    const { container } = render(<SkillBadge skill="SQL" variant="gray" />)
    const badge = container.querySelector('span')
    expect(badge.className).toContain('text-gray-600')
  })
})
