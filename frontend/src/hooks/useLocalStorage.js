/**
 * useLocalStorage.js - Persistent state hook with localStorage
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for syncing state with localStorage
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use provided initialValue
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Persist to localStorage whenever value changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (storedValue === undefined) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return

    function handleStorageChange(e) {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch {
          setStoredValue(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    setStoredValue(undefined)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  }, [key])

  return [storedValue, setStoredValue, removeValue]
}

/**
 * Hook for syncing state with sessionStorage
 * @param {string} key - sessionStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (storedValue === undefined) {
        window.sessionStorage.removeItem(key)
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(storedValue))
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    setStoredValue(undefined)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key)
    }
  }, [key])

  return [storedValue, setStoredValue, removeValue]
}

export default useLocalStorage
