/**
 * Hooks index - Export all custom hooks
 */

export {
  useFocusTrap,
  useKeyboardNavigation,
  useAnnounce,
  useFocusOnMount,
  usePrefersReducedMotion,
  useEscapeKey,
  useClickOutside,
} from './useA11y'

export {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
} from './useDebounce'

export {
  useLocalStorage,
  useSessionStorage,
} from './useLocalStorage'

export {
  useRealtimeTable,
  useNotifications,
  usePresence,
  useBroadcast,
  useRealtimeProjects,
  useRealtimeTeam,
} from './useRealtime'
