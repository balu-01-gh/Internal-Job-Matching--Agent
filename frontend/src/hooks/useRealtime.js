/**
 * useRealtime.js - React hooks for Supabase real-time features
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  supabase, 
  SUPABASE_ENABLED,
  subscribeToTable,
  subscribeToNotifications as subscribeNotifs,
  usePresence as initPresence,
  subscribeToBroadcast
} from '../services/supabase'

/**
 * Hook for subscribing to real-time table changes
 * 
 * @param {string} table - Table name
 * @param {Object} options - Subscription options
 * @returns {Object} { data, loading, error }
 */
export function useRealtimeTable(table, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { initialFetch = true, event = '*', filter } = options

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      setLoading(false)
      return
    }

    // Initial data fetch
    if (initialFetch && supabase) {
      let query = supabase.from(table).select('*')
      if (filter) {
        const [column, value] = filter.split('=eq.')
        query = query.eq(column, value)
      }
      
      query.then(({ data: initialData, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError)
        } else {
          setData(initialData || [])
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }

    // Subscribe to changes
    const unsubscribe = subscribeToTable(table, (payload) => {
      setData(current => {
        switch (payload.eventType) {
          case 'INSERT':
            return [...current, payload.new]
          case 'UPDATE':
            return current.map(item => 
              item.id === payload.new.id ? payload.new : item
            )
          case 'DELETE':
            return current.filter(item => item.id !== payload.old.id)
          default:
            return current
        }
      })
    }, { event, filter })

    return () => unsubscribe()
  }, [table, event, filter, initialFetch])

  return { data, loading, error }
}

/**
 * Hook for real-time notifications
 * 
 * @param {number} userId - User ID to watch
 * @returns {Object} { notifications, unreadCount, markAsRead, clearAll }
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId || !SUPABASE_ENABLED) return

    // Fetch initial notifications
    if (supabase) {
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
          }
        })
    }

    // Subscribe to new notifications
    const unsubscribe = subscribeNotifs(userId, (newNotification) => {
      setNotifications(current => [newNotification, ...current])
      setUnreadCount(count => count + 1)
    })

    return () => unsubscribe()
  }, [userId])

  const markAsRead = useCallback(async (notificationId) => {
    if (!supabase) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    setNotifications(current =>
      current.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(count => Math.max(0, count - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!supabase || !userId) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    setNotifications(current => current.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  const clearAll = useCallback(async () => {
    if (!supabase || !userId) return

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    setNotifications([])
    setUnreadCount(0)
  }, [userId])

  return { notifications, unreadCount, markAsRead, markAllAsRead, clearAll }
}

/**
 * Hook for tracking online presence
 * 
 * @param {string} channelName - Channel name for presence
 * @param {Object} userInfo - Current user's info to broadcast
 * @returns {Object} { onlineUsers, isTracking }
 */
export function usePresence(channelName, userInfo) {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const presenceRef = useRef(null)

  useEffect(() => {
    if (!SUPABASE_ENABLED || !userInfo?.id) return

    const presence = initPresence(channelName, userInfo, (users) => {
      setOnlineUsers(users)
    })

    presenceRef.current = presence
    presence.track()
    setIsTracking(true)

    return () => {
      presence.untrack()
      presence.unsubscribe()
      setIsTracking(false)
    }
  }, [channelName, userInfo])

  return { onlineUsers, isTracking }
}

/**
 * Hook for broadcasting and receiving custom events
 * 
 * @param {string} channelName - Channel name
 * @param {string} eventName - Event name to listen/broadcast
 * @returns {Object} { broadcast, lastMessage }
 */
export function useBroadcast(channelName, eventName) {
  const [lastMessage, setLastMessage] = useState(null)

  useEffect(() => {
    if (!SUPABASE_ENABLED) return

    const unsubscribe = subscribeToBroadcast(channelName, eventName, (payload) => {
      setLastMessage(payload)
    })

    return () => unsubscribe()
  }, [channelName, eventName])

  const broadcast = useCallback((payload) => {
    if (!supabase) return

    const channel = supabase.channel(channelName)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: eventName,
          payload,
        })
      }
    })
  }, [channelName, eventName])

  return { broadcast, lastMessage }
}

/**
 * Hook for real-time project updates
 * 
 * @returns {Object} { projects, loading }
 */
export function useRealtimeProjects() {
  return useRealtimeTable('projects', { event: '*' })
}

/**
 * Hook for real-time team updates
 * 
 * @param {number} teamId - Optional team ID to filter
 * @returns {Object} { members, loading }
 */
export function useRealtimeTeam(teamId) {
  const filter = teamId ? `team_id=eq.${teamId}` : undefined
  return useRealtimeTable('team_members', { filter })
}

export default {
  useRealtimeTable,
  useNotifications,
  usePresence,
  useBroadcast,
  useRealtimeProjects,
  useRealtimeTeam,
}
