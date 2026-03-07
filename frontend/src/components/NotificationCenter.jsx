/**
 * NotificationCenter.jsx - Integrated notification system for assignments and updates
 */

import React, { useState, useEffect } from 'react'

const NOTIFICATION_TYPES = {
  assignment: { icon: '📋', color: 'bg-gradient-to-r from-brand-50 to-brand-100 border-brand-500' },
  update: { icon: '🔄', color: 'bg-gradient-to-r from-warning-50 to-warning-100 border-warning-500' },
  completion: { icon: '✅', color: 'bg-gradient-to-r from-success-50 to-success-100 border-success-500' },
  feedback: { icon: '💬', color: 'bg-gradient-to-r from-accent-50 to-accent-100 border-accent-500' },
  reminder: { icon: '⏰', color: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-500' },
  system: { icon: '⚙️', color: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400' }
}

function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  const { icon, color } = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system

  return (
    <div className={`p-4 border-l-4 rounded-xl ${color} ${!notification.read ? 'shadow-md ring-1 ring-gray-100' : 'opacity-75'} transition-all hover:shadow-lg`}>
      <div className="flex items-start gap-3">
        <span className="text-xl bg-white/50 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-800 text-sm">
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 ml-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="w-6 h-6 bg-brand-100 hover:bg-brand-200 text-brand-600 rounded-full flex items-center justify-center transition-colors"
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="w-6 h-6 bg-danger-100 hover:bg-danger-200 text-danger-600 rounded-full flex items-center justify-center transition-colors"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1.5">{notification.message}</p>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span className="bg-white/50 px-2 py-1 rounded-lg">{new Date(notification.created_at).toLocaleString()}</span>
            {notification.actionUrl && (
              <a 
                href={notification.actionUrl}
                className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
              >
                View Details →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationCenter({ userId, userRole }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'assignments', 'updates'

  // Mock notifications - in real app, fetch from API
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'assignment',
        title: 'New Project Assignment',
        message: 'You have been assigned to the "AI Chatbot Development" project.',
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/employee/dashboard'
      },
      {
        id: 2,
        type: 'update',
        title: 'Project Status Update',
        message: 'Cloud Migration project timeline has been updated.',
        read: false,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/team-lead/overview'
      },
      {
        id: 3,
        type: 'feedback',
        title: 'Feedback Request',
        message: 'Please provide feedback for the completed E-commerce project.',
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/hr/feedback/3'
      },
      {
        id: 4,
        type: 'completion',
        title: 'Project Completed',
        message: 'Analytics Dashboard project has been marked as complete.',
        read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        type: 'reminder',
        title: 'Resume Update Reminder',
        message: 'Consider updating your resume with recent skills and experiences.',
        read: false,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/upload-resume'
      }
    ]

    // Simulate API delay
    setTimeout(() => {
      setNotifications(mockNotifications)
      setLoading(false)
    }, 1000)
  }, [userId])

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ))
  }

  const handleDelete = (notificationId) => {
    setNotifications(notifications.filter(notif => notif.id !== notificationId))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'assignments') return notif.type === 'assignment'
    if (filter === 'updates') return ['update', 'completion'].includes(notif.type)
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Loading notifications...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-brand-500 to-accent-500 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>🔔</span>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 px-2.5 py-0.5 bg-white/20 backdrop-blur text-white text-xs rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-white/90 hover:text-white font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'all', label: '📬 All' },
            { key: 'unread', label: '✨ Unread' },
            { key: 'assignments', label: '📋 Assignments' },
            { key: 'updates', label: '🔄 Updates' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                filter === key
                  ? 'bg-white text-brand-600 shadow-md'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">No notifications to display</p>
            <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 text-center">
          <span className="text-sm text-gray-600 font-medium">
            📊 Showing {filteredNotifications.length} of {notifications.length} notifications
          </span>
        </div>
      )}
    </div>
  )
}

// Utility hook for notification badge in navigation
export function useNotificationCount(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // In real app, fetch unread notification count from API
    // For now, mock it
    setCount(3) // Mock unread count
  }, [userId])

  return count
}