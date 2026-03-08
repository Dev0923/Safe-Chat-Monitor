import React from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

const Toast = ({ type, message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-green-50 dark:bg-green-900',
    error: 'bg-red-50 dark:bg-red-900',
    info: 'bg-blue-50 dark:bg-blue-900',
  }[type]

  const textColor = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
  }[type]

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[type]

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg flex items-center gap-3 alert-enter`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
      <button
        onClick={onClose}
        className="ml-auto text-lg hover:opacity-70"
      >
        ×
      </button>
    </div>
  )
}

export default Toast
