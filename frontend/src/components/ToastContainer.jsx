/**
 * ToastContainer.jsx - Container for displaying all toasts
 */

import React from 'react'
import Toast from './Toast'
import { useToast } from '../context/ToastContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}
