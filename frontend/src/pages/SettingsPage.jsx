import React, { useState, useEffect } from 'react'
import { Settings, Lock, Moon, Mail, ArrowLeft, User, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { userAPI } from '../services/api'

const Toggle = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
      enabled ? 'bg-emerald-500' : 'bg-white/10'
    }`}
    style={{ border: enabled ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.12)' }}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
      enabled ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
)

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [settings, setSettings] = useState({
    emailAlertEnabled: true,
    darkModeEnabled: false,
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await userAPI.getProfile(user.id)
        setSettings({
          emailAlertEnabled: response.data.emailAlertEnabled,
          darkModeEnabled: response.data.darkModeEnabled,
        })
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    if (user?.id) fetchSettings()
  }, [user])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleToggleEmailAlerts = async () => {
    try {
      await userAPI.toggleEmailAlerts(user.id)
      setSettings(prev => ({ ...prev, emailAlertEnabled: !prev.emailAlertEnabled }))
      showMessage('success', 'Email preferences updated')
    } catch {
      showMessage('error', 'Failed to update preferences')
    }
  }

  const handleToggleDarkMode = async () => {
    try {
      await userAPI.toggleDarkMode(user.id)
      setSettings(prev => ({ ...prev, darkModeEnabled: !prev.darkModeEnabled }))
      showMessage('success', 'Appearance updated')
    } catch {
      showMessage('error', 'Failed to update preferences')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await userAPI.updatePassword(user.id, passwordData.oldPassword, passwordData.newPassword)
      showMessage('success', 'Password changed successfully')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#0a0e1a' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
          </div>
        </div>

        {/* Toast Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Account Info */}
        <div className="card mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-white font-semibold">Account</h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Email Address', value: user?.email },
              { label: 'Account Type', value: user?.role?.replace('ROLE_', '') },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium capitalize">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-white font-semibold">Notifications</h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white text-sm font-medium">Email Alerts</p>
              <p className="text-gray-500 text-xs mt-0.5">Get notified via email when risky messages are detected</p>
            </div>
            <Toggle enabled={settings.emailAlertEnabled} onToggle={handleToggleEmailAlerts} />
          </div>
        </div>

        {/* Appearance */}
        <div className="card mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
              <Moon className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-white font-semibold">Appearance</h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white text-sm font-medium">Dark Mode</p>
              <p className="text-gray-500 text-xs mt-0.5">Use dark background for easier viewing</p>
            </div>
            <Toggle enabled={settings.darkModeEnabled} onToggle={handleToggleDarkMode} />
          </div>
        </div>

        {/* Security */}
        <div className="card mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold">Security</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { label: 'Current Password', key: 'oldPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-2">{field.label}</label>
                <input
                  type="password"
                  value={passwordData[field.key]}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="input-field"
                  required
                  placeholder="••••••••"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card"
             style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
          <h2 className="text-red-400 font-semibold mb-2">Danger Zone</h2>
          <p className="text-gray-500 text-sm mb-5">You will be signed out from all devices.</p>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
