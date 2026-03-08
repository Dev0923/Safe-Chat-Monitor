import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Settings, LogOut, Shield } from 'lucide-react'
import useAuthStore from '../store/authStore'

const Navigation = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-900" />
            </div>
            <span className="text-white font-bold text-base">SafeMonitor</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* User badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-gray-300 text-sm">{user?.name}</span>
            </div>

            <Link
              to="/settings"
              className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pt-4 space-y-2"
               style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-2 text-gray-400 text-sm">{user?.name}</div>

            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation
