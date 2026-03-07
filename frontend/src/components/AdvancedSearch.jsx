/**
 * AdvancedSearch.jsx - Advanced search with filters and suggestions
 */

import React, { useState, useRef, useEffect } from 'react'

export default function AdvancedSearch({ 
  placeholder = 'Search...', 
  onSearch = () => {},
  onFilterChange = () => {},
  filters = [],
  suggestions = [],
  debounceMs = 300 
}) {
  const [value, setValue] = useState('')
  const [timeoutId, setTimeoutId] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])
  const searchRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    const newValue = e.target.value
    setValue(newValue)
    setShowSuggestions(newValue.length > 0)

    if (timeoutId) clearTimeout(timeoutId)
    
    const newTimeoutId = setTimeout(() => {
      onSearch(newValue)
    }, debounceMs)
    
    setTimeoutId(newTimeoutId)
  }

  const handleSuggestionClick = (suggestion) => {
    setValue(suggestion)
    setShowSuggestions(false)
    onSearch(suggestion)
  }

  const handleFilterToggle = (filterId) => {
    const updatedFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId]
    
    setActiveFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const handleClear = () => {
    setValue('')
    setActiveFilters([])
    setShowSuggestions(false)
    onSearch('')
    onFilterChange([])
  }

  return (
    <div className="w-full space-y-3" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => value && setShowSuggestions(true)}
            placeholder={placeholder}
            className="
              w-full px-4 py-2.5 pl-10 pr-10 rounded-xl
              border border-gray-200 dark:border-gray-600
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              transition-all duration-200
            "
          />
          <svg className="absolute left-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2.5 hover:bg-brand-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterToggle(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeFilters.includes(filter.id)
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {activeFilters.includes(filter.id) && (
                <span className="text-white">✓</span>
              )}
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Active Filters Count */}
      {activeFilters.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} applied
        </div>
      )}
    </div>
  )
}
