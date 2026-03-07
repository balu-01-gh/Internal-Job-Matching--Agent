/**
 * Pagination.jsx - Pagination control component
 */

import React, { useState } from 'react'

export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  className = '',
  showItemsPerPage = false,
  showInfo = true,
  compact = false
}) {
  const pages = []
  const maxVisible = compact ? 3 : 5

  // Calculate page range to display
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  // Add first page if not visible
  if (startPage > 1) {
    pages.push(1)
    if (startPage > 2) pages.push('...')
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  // Add last page if not visible
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('...')
    pages.push(totalPages)
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Info Bar */}
      {showInfo && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> items
          </span>

          {/* Items Per Page Selector */}
          {showItemsPerPage && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            ← {!compact && 'Prev'}
          </button>

          <div className="flex items-center gap-1">
            {pages.map((page, i) => (
              <button
                key={i}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...' || page === currentPage}
                className={`
                  w-9 h-9 rounded-lg font-medium transition-all
                  ${page === '...' 
                    ? 'cursor-default text-gray-400' 
                    : page === currentPage
                      ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg'
                      : 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                title={typeof page === 'number' ? `Go to page ${page}` : ''}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            {!compact && 'Next'} →
          </button>
        </div>
      )}

      {/* Total Pages Info */}
      {showInfo && totalPages > 0 && !compact && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
        </div>
      )}
    </div>
  )
}

/**
 * SimplePageSize selector component
 */
export function PageSizeSelector({ 
  value = 10, 
  onChange = () => {},
  options = [5, 10, 25, 50, 100],
  label = 'Items per page'
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

/**
 * Pagination Info component - displays pagination information
 */
export function PaginationInfo({ 
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  className = ''
}) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      Showing <span className="font-semibold">{startItem}</span> to{' '}
      <span className="font-semibold">{endItem}</span> of{' '}
      <span className="font-semibold">{totalItems}</span> results
      {totalPages > 1 && (
        <span className="ml-2">
          (Page <span className="font-semibold">{currentPage}</span> of{' '}
          <span className="font-semibold">{totalPages}</span>)
        </span>
      )}
    </div>
  )
}
