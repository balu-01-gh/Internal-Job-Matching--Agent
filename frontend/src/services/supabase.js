/**
 * supabase.js - Supabase Client for Real-time Features
 * Provides real-time subscriptions, authentication, and storage
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Create Supabase client (or null if not configured)
export const supabase = SUPABASE_ENABLED 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

/**
 * Subscribe to real-time changes on a table
 * 
 * @param {string} table - Table name to subscribe to
 * @param {Function} callback - Function called with payload on changes
 * @param {Object} options - Subscription options
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTable(table, callback, options = {}) {
  if (!supabase) {
    console.warn('Supabase not configured, real-time disabled')
    return () => {}
  }

  const { event = '*', filter } = options

  let channel = supabase
    .channel(`realtime:${table}`)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter,
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to notifications for a specific user
 * 
 * @param {number} userId - User ID to subscribe to
 * @param {Function} onNotification - Callback for new notifications
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(userId, onNotification) {
  if (!supabase) return () => {}

  return subscribeToTable(
    'notifications',
    (payload) => {
      if (payload.eventType === 'INSERT') {
        onNotification(payload.new)
      }
    },
    {
      event: 'INSERT',
      filter: `user_id=eq.${userId}`,
    }
  )
}

/**
 * Subscribe to project updates
 * 
 * @param {Function} onUpdate - Callback for project changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToProjects(onUpdate) {
  if (!supabase) return () => {}

  return subscribeToTable('projects', (payload) => {
    onUpdate(payload.eventType, payload.new || payload.old)
  })
}

/**
 * Subscribe to team assignments
 * 
 * @param {number} teamId - Team ID to watch
 * @param {Function} onUpdate - Callback for assignment changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTeamAssignments(teamId, onUpdate) {
  if (!supabase) return () => {}

  return subscribeToTable(
    'team_assignments',
    (payload) => {
      onUpdate(payload.eventType, payload.new || payload.old)
    },
    {
      filter: `team_id=eq.${teamId}`,
    }
  )
}

/**
 * Broadcast a custom event to all connected clients
 * 
 * @param {string} channelName - Channel to broadcast on
 * @param {string} event - Event name
 * @param {Object} payload - Data to send
 */
export function broadcast(channelName, event, payload) {
  if (!supabase) return

  const channel = supabase.channel(channelName)
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
  })
}

/**
 * Subscribe to broadcast events on a channel
 * 
 * @param {string} channelName - Channel to listen on
 * @param {string} event - Event name to listen for
 * @param {Function} callback - Callback for received events
 * @returns {Function} Unsubscribe function
 */
export function subscribeToBroadcast(channelName, event, callback) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel(channelName)
    .on('broadcast', { event }, (payload) => {
      callback(payload.payload)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Presence - track online users
 * 
 * @param {string} channelName - Channel for presence tracking
 * @param {Object} userState - Current user's state
 * @param {Function} onSync - Callback when presence state syncs
 * @returns {Object} { track, untrack, unsubscribe }
 */
export function usePresence(channelName, userState, onSync) {
  if (!supabase) {
    return {
      track: () => {},
      untrack: () => {},
      unsubscribe: () => {},
    }
  }

  const channel = supabase.channel(channelName, {
    config: { presence: { key: userState.id?.toString() } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      onSync(Object.values(state).flat())
    })
    .subscribe()

  return {
    track: () => channel.track(userState),
    untrack: () => channel.untrack(),
    unsubscribe: () => supabase.removeChannel(channel),
  }
}

// ── Storage Helpers ──────────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {File} file - File to upload
 * @returns {Promise<string|null>} Public URL or null on error
 */
export async function uploadFile(bucket, path, file) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (err) {
    console.error('Upload error:', err)
    return null
  }
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string[]} paths - File paths to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFiles(bucket, paths) {
  if (!supabase) return false

  try {
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
    return true
  } catch (err) {
    console.error('Delete error:', err)
    return false
  }
}

// ── Database Helpers ─────────────────────────────────────────────────────────

/**
 * Fetch data from a Supabase table
 * 
 * @param {string} table - Table name
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of records
 */
export async function fetchFromTable(table, options = {}) {
  if (!supabase) return []

  const { columns = '*', filters = {}, limit, orderBy } = options

  let query = supabase.from(table).select(columns)

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value)
  }

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
  }

  // Apply limit
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Fetch error:', error)
    return []
  }

  return data
}

/**
 * Insert data into a Supabase table
 * 
 * @param {string} table - Table name
 * @param {Object|Array} data - Data to insert
 * @returns {Promise<Object|null>} Inserted data or null on error
 */
export async function insertIntoTable(table, data) {
  if (!supabase) return null

  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()

  if (error) {
    console.error('Insert error:', error)
    return null
  }

  return result
}

export default supabase
