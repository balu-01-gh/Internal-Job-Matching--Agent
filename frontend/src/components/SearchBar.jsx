/**
 * SearchBar.jsx - Reusable search input component
 */

import React, { useState, useCallback } from 'react'

export default function SearchBar({ 
  placeholder = 'Search...', 
  onSearch = () => {},
  debounceMs = 300 
}) {
  const [value, setValue] = useState('')
  const [timeoutId, setTimeoutId] = useState(null)

  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    setValue(newValue)

    if (timeoutId) clearTimeout(timeoutId)
    
    const newTimeoutId = setTimeout(() => {
      onSearch(newValue)
    }, debounceMs)
    
    setTimeoutId(newTimeoutId)
  }, [timeoutId, debounceMs, onSearch])

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={handleChange}
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
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
