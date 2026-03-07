/**
 * useA11y.js - Accessibility utilities and hooks
 * Provides focus management, keyboard navigation, and screen reader support
 */

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Hook for managing focus trap within a container (useful for modals/dialogs)
 * @param {boolean} isActive - Whether the focus trap is active
 * @returns {Object} - Ref to attach to the container
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element when trap activates
    firstElement?.focus()

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return containerRef
}

/**
 * Hook for keyboard navigation in lists/menus
 * @param {Object} options - Configuration options
 * @returns {Object} - Props to spread on the container and items
 */
export function useKeyboardNavigation({ 
  itemCount, 
  onSelect, 
  orientation = 'vertical',
  loop = true 
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)

  const handleKeyDown = useCallback((e) => {
    const isVertical = orientation === 'vertical'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'

    switch (e.key) {
      case prevKey:
        e.preventDefault()
        setActiveIndex(prev => {
          if (prev <= 0) return loop ? itemCount - 1 : 0
          return prev - 1
        })
        break
      case nextKey:
        e.preventDefault()
        setActiveIndex(prev => {
          if (prev >= itemCount - 1) return loop ? 0 : itemCount - 1
          return prev + 1
        })
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(itemCount - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect?.(activeIndex)
        break
      default:
        break
    }
  }, [itemCount, orientation, loop, onSelect, activeIndex])

  const getItemProps = useCallback((index) => ({
    role: 'option',
    'aria-selected': index === activeIndex,
    tabIndex: index === activeIndex ? 0 : -1,
    onFocus: () => setActiveIndex(index),
    onClick: () => onSelect?.(index),
  }), [activeIndex, onSelect])

  return {
    containerRef,
    containerProps: {
      ref: containerRef,
      role: 'listbox',
      'aria-activedescendant': `item-${activeIndex}`,
      onKeyDown: handleKeyDown,
      tabIndex: 0,
    },
    activeIndex,
    setActiveIndex,
    getItemProps,
  }
}

/**
 * Hook for announcing messages to screen readers
 * @returns {Function} - announce function
 */
export function useAnnounce() {
  const announcerRef = useRef(null)

  useEffect(() => {
    // Create announcer element if it doesn't exist
    let announcer = document.getElementById('a11y-announcer')
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'a11y-announcer'
      announcer.setAttribute('role', 'status')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `
      document.body.appendChild(announcer)
    }
    announcerRef.current = announcer

    return () => {
      // Don't remove on cleanup as other components may use it
    }
  }, [])

  const announce = useCallback((message, priority = 'polite') => {
    if (!announcerRef.current) return

    // Set priority level
    announcerRef.current.setAttribute('aria-live', priority)
    
    // Clear and set message (this triggers the announcement)
    announcerRef.current.textContent = ''
    requestAnimationFrame(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message
      }
    })
  }, [])

  return announce
}

/**
 * Hook for managing focus on mount/unmount
 * @param {boolean} shouldFocus - Whether to focus on mount
 * @returns {Object} - Ref to attach to the element
 */
export function useFocusOnMount(shouldFocus = true) {
  const elementRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!shouldFocus) return

    // Store current focus
    previousFocusRef.current = document.activeElement

    // Focus the element
    if (elementRef.current) {
      elementRef.current.focus()
    }

    // Restore focus on unmount
    return () => {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [shouldFocus])

  return elementRef
}

/**
 * Hook for reduced motion preference
 * @returns {boolean} - Whether user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    function handleChange(e) {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for managing escape key to close modals/dropdowns
 * @param {Function} onEscape - Callback when escape is pressed
 * @param {boolean} isActive - Whether to listen for escape
 */
export function useEscapeKey(onEscape, isActive = true) {
  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, isActive])
}

/**
 * Hook for click outside detection
 * @param {Function} onClickOutside - Callback when clicking outside
 * @param {boolean} isActive - Whether to listen for clicks
 * @returns {Object} - Ref to attach to the container
 */
export function useClickOutside(onClickOutside, isActive = true) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return

    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClickOutside()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [onClickOutside, isActive])

  return ref
}

export default {
  useFocusTrap,
  useKeyboardNavigation,
  useAnnounce,
  useFocusOnMount,
  usePrefersReducedMotion,
  useEscapeKey,
  useClickOutside,
}
