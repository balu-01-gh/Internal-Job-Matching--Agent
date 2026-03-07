/**
 * useSearch.js - Custom hook for search functionality
 */

import { useState, useCallback, useMemo } from 'react'

export function useSearch(items = [], searchKey = 'name', filterKeys = []) {
  const [searchValue, setSearchValue] = useState('')
  const [activeFilters, setActiveFilters] = useState([])

  const filteredItems = useMemo(() => {
    let result = items

    // Apply text search
    if (searchValue.trim()) {
      const lowerSearch = searchValue.toLowerCase()
      result = result.filter(item => {
        const searchText = item[searchKey]?.toString().toLowerCase() || ''
        return searchText.includes(lowerSearch)
      })
    }

    // Apply filters
    if (activeFilters.length > 0 && filterKeys.length > 0) {
      result = result.filter(item => {
        return activeFilters.some(filterId => {
          const filterKey = filterKeys.find(k => k.id === filterId)
          if (!filterKey) return false
          
          const itemValue = item[filterKey.field]
          return filterKey.values.includes(itemValue)
        })
      })
    }

    return result
  }, [items, searchValue, activeFilters, searchKey, filterKeys])

  const handleSearch = useCallback((value) => {
    setSearchValue(value)
  }, [])

  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchValue('')
    setActiveFilters([])
  }, [])

  return {
    searchValue,
    activeFilters,
    filteredItems,
    handleSearch,
    handleFilterChange,
    clearSearch,
    itemsCount: filteredItems.length,
  }
}

export function useFuzzySearch(items = [], searchKey = 'name') {
  const [searchValue, setSearchValue] = useState('')

  // Simple fuzzy search algorithm
  const fuzzySearch = (items, query, key) => {
    if (!query) return items

    const lowerQuery = query.toLowerCase()
    return items.filter(item => {
      const text = item[key]?.toString().toLowerCase() || ''
      let queryIdx = 0
      
      for (let i = 0; i < text.length && queryIdx < lowerQuery.length; i++) {
        if (text[i] === lowerQuery[queryIdx]) {
          queryIdx++
        }
      }
      
      return queryIdx === lowerQuery.length
    }).sort((a, b) => {
      const aText = a[key]?.toString().toLowerCase() || ''
      const bText = b[key]?.toString().toLowerCase() || ''
      
      // Prioritize items that start with the query
      const aStarts = aText.startsWith(lowerQuery)
      const bStarts = bText.startsWith(lowerQuery)
      
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      
      return 0
    })
  }

  const filteredItems = useMemo(() => {
    return fuzzySearch(items, searchValue, searchKey)
  }, [items, searchValue, searchKey])

  const handleSearch = useCallback((value) => {
    setSearchValue(value)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchValue('')
  }, [])

  return {
    searchValue,
    filteredItems,
    handleSearch,
    clearSearch,
    itemsCount: filteredItems.length,
  }
}

export function useMultiFieldSearch(items = [], fields = []) {
  const [searchValue, setSearchValue] = useState('')

  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return items

    const lowerSearch = searchValue.toLowerCase()
    return items.filter(item => {
      return fields.some(field => {
        const value = item[field]?.toString().toLowerCase() || ''
        return value.includes(lowerSearch)
      })
    })
  }, [items, searchValue, fields])

  const handleSearch = useCallback((value) => {
    setSearchValue(value)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchValue('')
  }, [])

  return {
    searchValue,
    filteredItems,
    handleSearch,
    clearSearch,
    itemsCount: filteredItems.length,
  }
}
