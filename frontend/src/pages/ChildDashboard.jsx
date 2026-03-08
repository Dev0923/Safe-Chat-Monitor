import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Bell, AlertTriangle, Settings, LogOut, Menu, MessageSquare, Users, Chrome, X, CheckCircle, Copy, BookOpen, Link } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { alertAPI, authAPI } from '../services/api'

// Child-specific panel components
import SafeChatPanel            from '../components/child/SafeChatPanel'
import ChildAlertsPanel         from '../components/child/ChildAlertsPanel'
import ChildNotificationsPanel  from '../components/child/ChildNotificationsPanel'
import ChildSettingsPanel       from '../components/child/ChildSettingsPanel'
import ChildrenPanel            from '../components/child/ChildrenPanel'
import CyberSafetyLearningPanel from '../components/child/CyberSafetyLearningPanel'
import AskBeforeYouClickPanel   from '../components/child/AskBeforeYouClickPanel'

/* ─── Nav config ──────────────────────────────────────────────────────────── */
const navItems = [
  { id: 'chat',          label: 'Safe Chat',      icon: MessageSquare,  badge: null      },
  { id: 'ask-before-click', label: 'Ask Before You Click', icon: Link,   badge: null      },
  { id: 'cyber-learning',label: 'Cyber Safety Learning', icon: BookOpen, badge: null      },
  { id: 'alerts',        label: 'Alerts',         icon: AlertTriangle,  badge: 'alerts'  },
  { id: 'children',      label: 'My Profile',     icon: Users,          badge: null      },
  { id: 'notifications', label: 'Notifications',  icon: Bell,           badge: 'notifs'  },
  { id: 'settings',      label: 'Settings',       icon: Settings,       badge: null      },
]

const pageTitles = {
  chat:          'Safe Chat',
  'ask-before-click': 'Ask Before You Click',
  'cyber-learning': 'Cyber Safety Learning',
  alerts:        'My Alerts',
  children:      'My Profile',
  notifications: 'Notifications',
  settings:      'Settings',
}

/* ─── Panel router ────────────────────────────────────────────────────────── */
const PageContent = ({ activeNav }) => {
  switch (activeNav) {
    case 'chat':          return <SafeChatPanel />
    case 'ask-before-click': return <AskBeforeYouClickPanel />
    case 'cyber-learning': return <CyberSafetyLearningPanel />
    case 'alerts':        return <ChildAlertsPanel />
    case 'children':      return <ChildrenPanel />
    case 'notifications': return <ChildNotificationsPanel />
    case 'settings':      return <ChildSettingsPanel />
    default:              return <SafeChatPanel />
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const ChildDashboard = () => {
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuthStore()

  const [activeNav,   setActiveNav]   = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifCount,  setNotifCount]  = useState(0)
  const [alertCount,  setAlertCount]  = useState(0)
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [copiedChildId, setCopiedChildId] = useState(false)

  useEffect(() => {
    alertAPI.getParentAlerts()
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : res.data?.alerts || res.data?.content || []
        const unresolved = items.filter(a => a.status !== 'RESOLVED')
        const highMedium = unresolved.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'MEDIUM')
        setAlertCount(highMedium.length)
        setNotifCount(unresolved.length)
      })
      .catch(() => { setAlertCount(0); setNotifCount(0) })
  }, [])

  // If childId is missing (stale session before parent linked account), refresh it
  useEffect(() => {
    if (!user?.childId) {
      authAPI.validateToken()
        .then(res => {
          if (res.data?.childId) {
            setUser({ ...user, childId: res.data.childId })
          }
        })
        .catch(() => {})
    }
  }, [])

  // Show extension modal on first login (once per session)
  useEffect(() => {
    const extensionDismissed = sessionStorage.getItem('extensionModalDismissed')
    if (!extensionDismissed) {
      // Show modal after 1.5 seconds to let dashboard load first
      const timer = setTimeout(() => {
        setShowExtensionModal(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismissExtensionModal = () => {
    setShowExtensionModal(false)
    sessionStorage.setItem('extensionModalDismissed', 'true')
  }

  const extensionChildId = user?.childId || ''

  const copyChildId = () => {
    if (extensionChildId) {
      navigator.clipboard.writeText(extensionChildId)
      setCopiedChildId(true)
      setTimeout(() => setCopiedChildId(false), 2000)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  /* ── Sidebar ── */
  const SidebarContent = () => (
    <aside className="flex flex-col h-full" style={{
      background: 'rgba(10,14,26,0.97)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      width: '224px',
      minWidth: '224px',
    }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-sm">Safe Chat</span>
        <span className="ml-auto text-base">🪙</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const active = activeNav === id
          const count  = badge === 'alerts' ? alertCount : badge === 'notifs' ? notifCount : 0
          return (
            <button key={id}
              onClick={() => { setActiveNav(id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <div className="relative flex-shrink-0">
                <Icon className="w-4 h-4" />
                {count > 0 && !active && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{count}</span>
                )}
              </div>
              <span className="flex-1 text-left">{label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="flex h-screen overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 20% 50%, #0d1b2a 0%, #0a0e1a 60%, #050810 100%)',
    }}>

      {/* Background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {[...Array(55)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width:  Math.random() > 0.7 ? '2px' : '1px',
              height: Math.random() > 0.7 ? '2px' : '1px',
              top:    `${Math.random() * 100}%`,
              left:   `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.35,
            }} />
        ))}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 relative" style={{ zIndex: 10 }}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ zIndex: 5, position: 'relative' }}>

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background:   'rgba(10,14,26,0.75)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-bold text-lg">{pageTitles[activeNav] || 'Child Dashboard'}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Extension Setup Button */}
            <button onClick={() => setShowExtensionModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-blue-400 hover:text-blue-300 transition-colors"
              title="Extension Setup"
              style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)' }}>
              <Chrome className="w-4 h-4" />
              <span className="text-xs font-semibold">Extension Setup</span>
            </button>
            {/* Notifications bell */}
            <button onClick={() => setActiveNav('notifications')}
              className="relative p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
              title="Notifications"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{notifCount}</span>
              )}
            </button>
            {/* Alerts warning */}
            <button onClick={() => setActiveNav('alerts')}
              className="relative p-2 rounded-xl text-gray-400 hover:text-amber-400 transition-colors"
              title="Alerts"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <AlertTriangle className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{alertCount}</span>
              )}
            </button>
            {/* Settings */}
            <button onClick={() => setActiveNav('settings')}
              className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <Settings className="w-5 h-5" />
            </button>
            {/* Avatar */}
            <button onClick={() => setActiveNav('children')}
              className="w-9 h-9 rounded-full border-2 border-blue-500/50 flex items-center justify-center bg-gradient-to-br from-blue-600 to-emerald-600 ml-1 flex-shrink-0 cursor-pointer hover:border-blue-400/70 transition-colors">
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase() || 'C'}</span>
            </button>
          </div>
        </header>

        {/* Page content — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-6xl mx-auto">
            <PageContent activeNav={activeNav} />
          </div>
        </div>

      </div>

      {/* Extension Installation Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" 
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="relative max-w-2xl w-full rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ 
              background: 'linear-gradient(135deg, rgba(10,20,50,0.98) 0%, rgba(15,30,65,0.98) 100%)',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
            
            {/* Close button */}
            <button onClick={handleDismissExtensionModal}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-0 flex-shrink-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0">
                  <Chrome className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">Install Safety Monitor Extension</h2>
                  <p className="text-gray-400 text-sm mt-1">Enable automatic activity tracking</p>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Why install */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="text-blue-300 text-sm font-medium mb-2">✨ Why Install?</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The Safety Monitor extension helps keep you safe online by sharing your browsing activity with your parents. 
                  This allows them to monitor your online safety and protect you from harmful content.
                </p>
              </div>

              {/* Installation Steps */}
              <div>
                <p className="text-white font-semibold text-sm mb-3">📦 Installation Steps:</p>
                
                {/* Download Button */}
                <div className="mb-4">
                  <a 
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/extension/download`}
                    download
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all"
                    style={{ 
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}>
                    <Chrome className="w-4 h-4" />
                    Download Extension (.zip)
                  </a>
                  <p className="text-gray-400 text-xs mt-2">Download and extract the zip file to your computer</p>
                </div>

                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                    <span>Open Chrome and go to{' '}
                      <a 
                        href="chrome://extensions/" 
                        target="_blank"
                        className="inline-flex items-center px-2 py-0.5 rounded bg-gray-800 text-blue-400 text-xs hover:bg-gray-700 hover:text-blue-300 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open('chrome://extensions/', '_blank');
                        }}>
                        chrome://extensions/
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <span>Enable <strong className="text-white">"Developer mode"</strong> (toggle in top-right)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <span>Click <strong className="text-white">"Load unpacked"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                    <span>Extract the downloaded zip and select the <strong className="text-white">extension</strong> folder</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">5</span>
                    <span>Click the extension icon and enter your <strong className="text-white">Child ID</strong> below</span>
                  </li>
                </ol>
              </div>

              {/* Child ID */}
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-2">🆔 Your Child ID:</label>
                {extensionChildId ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={extensionChildId}
                      className="flex-1 px-4 py-3 rounded-lg text-white font-mono text-sm bg-gray-900/80 border border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={copyChildId}
                      className="px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                      style={{ 
                        background: copiedChildId ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: 'white'
                      }}>
                      {copiedChildId ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-yellow-300 text-xs">
                      ⚠️ Child ID not available. Please contact your parent to set up your account properly.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="p-6 pt-0 flex-shrink-0">
              <div className="flex gap-3">
                <button onClick={handleDismissExtensionModal}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                  I'll Do This Later
                </button>
                <button onClick={handleDismissExtensionModal}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  Got It!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChildDashboard
