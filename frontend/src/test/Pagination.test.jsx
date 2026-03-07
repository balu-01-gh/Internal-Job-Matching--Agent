import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../components/Pagination'

describe('Pagination', () => {
  it('renders page info when showInfo is true', () => {
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={50} itemsPerPage={10} showInfo />
    )
    expect(screen.getByText(/1/)).toBeInTheDocument()
  })

  it('calls onPageChange when next button clicked', () => {
    const onChange = vi.fn()
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={30} itemsPerPage={10} onPageChange={onChange} />
    )
    // Find next/forward button (aria-label or last button)
    const buttons = screen.getAllByRole('button')
    const nextBtn = buttons[buttons.length - 1]
    fireEvent.click(nextBtn)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('disables previous button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={30} itemsPerPage={10} />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(
      <Pagination currentPage={3} totalPages={3} totalItems={30} itemsPerPage={10} />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[buttons.length - 1]).toBeDisabled()
  })

  it('renders correct page numbers', () => {
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={30} itemsPerPage={10} />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
