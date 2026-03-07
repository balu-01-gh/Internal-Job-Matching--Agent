/**
 * usePagination.js - Custom hook for pagination logic
 */

import { useState, useMemo } from 'react'

/**
 * Hook for managing pagination
 * @param {Array} items - Full array of items to paginate
 * @param {Number} itemsPerPage - Number of items per page
 * @returns {Object} Pagination state and helpers
 */
export function usePagination(items = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const pageData = useMemo(() => {
    const totalItems = items.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    // Validate current page
    const validPage = Math.min(Math.max(1, currentPage), totalPages || 1)
    
    const startIndex = (validPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = items.slice(startIndex, endIndex)

    return {
      currentPage: validPage,
      totalPages,
      totalItems,
      currentItems,
      startIndex,
      endIndex,
      hasNextPage: validPage < totalPages,
      hasPrevPage: validPage > 1,
    }
  }, [items, itemsPerPage, currentPage])

  const goToPage = (page) => {
    const pageNum = Math.max(1, page)
    setCurrentPage(pageNum)
  }

  const nextPage = () => {
    if (pageData.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (pageData.hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const reset = () => {
    setCurrentPage(1)
  }

  return {
    ...pageData,
    goToPage,
    nextPage,
    prevPage,
    reset,
  }
}

/**
 * Hook for managing pagination with search/filter
 * @param {Array} items - Full array of items
 * @param {Number} itemsPerPage - Items per page
 * @returns {Object} Pagination and filtering state
 */
export function usePaginationWithFilter(items = [], itemsPerPage = 10) {
  const pagination = usePagination(items, itemsPerPage)
  const [searchValue, setSearchValue] = useState('')
  const [filterFn, setFilterFn] = useState(() => () => true)

  const filteredItems = useMemo(() => {
    return items.filter(filterFn)
  }, [items, filterFn])

  const paginatedData = usePagination(filteredItems, itemsPerPage)

  return {
    ...paginatedData,
    filteredCount: filteredItems.length,
    originalCount: items.length,
    setFilter: setFilterFn,
    setSearch: setSearchValue,
    searchValue,
  }
}

/**
 * Hook for cursor-based pagination (useful for large datasets)
 * @param {Function} fetchFn - Function that fetches items
 * @param {Number} pageSize - Number of items per page
 * @returns {Object} Cursor pagination state
 */
export function useCursorPagination(fetchFn = null, pageSize = 10) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMore = async () => {
    if (!fetchFn || isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const result = await fetchFn({ cursor, limit: pageSize })
      setItems(prev => [...prev, ...result.items])
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    items,
    cursor,
    hasMore,
    isLoading,
    error,
    loadMore,
    reset: () => {
      setItems([])
      setCursor(null)
      setHasMore(true)
      setError(null)
    },
  }
}
