import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Shield, Activity, Users, Settings,
  LogOut, LayoutDashboard, FileText, CheckCircle, Plus,
  TrendingUp, AlertTriangle, Trash2, Eye, Clock, X, Globe
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import useAuthStore from '../store/authStore'
import { alertAPI, childAPI } from '../services/api'
import { connectWebSocket, disconnectWebSocket } from '../services/websocket'
import AlertsPanel       from '../components/dashboard/AlertsPanel'
import ChildrenPanel     from '../components/dashboard/ChildrenPanel'
import ActivityLogsPanel from '../components/dashboard/ActivityLogsPanel'
import BrowsingActivityPanel from '../components/dashboard/BrowsingActivityPanel'
import NotificationsPanel from '../components/dashboard/NotificationsPanel'
import SettingsPanel     from '../components/dashboard/SettingsPanel'

const BlueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(5,15,40,0.97)',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <p style={{ color: '#93c5fd', fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

const NavItem = ({ icon: Icon, label, active, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
    style={{
      background: active ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
      color: active ? '#ffffff' : danger ? '#f87171' : '#94a3b8',
      boxShadow: active ? '0 4px 15px rgba(37,99,235,0.4)' : 'none',
    }}
  >
    <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
    {label}
  </button>
)

const RiskBadge = ({ level }) => {
  const cfg = {
    HIGH:   { bg: 'rgba(127,29,29,0.7)',  color: '#fca5a5', text: 'High' },
    MEDIUM: { bg: 'rgba(120,53,15,0.7)',  color: '#fcd34d', text: 'Medium' },
    LOW:    { bg: 'rgba(20,83,45,0.7)',   color: '#86efac', text: 'Low' },
    SAFE:   { bg: 'rgba(20,83,45,0.7)',   color: '#86efac', text: 'Safe' },
  }
  const c = cfg[level] || cfg.LOW
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 6 }}>
      {c.text}
    </span>
  )
}

const ParentDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [children, setChildren] = useState([])
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({ totalAlerts: 0, highRiskAlerts: 0, mediumRiskAlerts: 0, unresolvedCount: 0 })
  const [loading, setLoading] = useState(true)
  // Add Child Modal
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  const [linkAge, setLinkAge] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  // View Activity Modal
  const [activityChild, setActivityChild] = useState(null)
  const [activityMessages, setActivityMessages] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  // Remove Child Modal
  const [removeChild, setRemoveChild] = useState(null)
  const [removeLoading, setRemoveLoading] = useState(false)


  const fetchChildren = async () => {
    try {
      if (user?.id) {
        const childRes = await childAPI.getParentChildren(user.id).catch(() => ({ data: [] }))
        setChildren(childRes.data || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        if (user?.id) {
          const [childRes, alertRes] = await Promise.all([
            childAPI.getParentChildren(user.id).catch(() => ({ data: [] })),
            alertAPI.getUnresolvedAlerts({ limit: 50 }).catch(() => ({ data: { alerts: [] } })),
          ])
          setChildren(childRes.data || [])
          const alertData = alertRes.data
          const alertItems = Array.isArray(alertData)
            ? alertData
            : Array.isArray(alertData?.alerts)
              ? alertData.alerts
              : Array.isArray(alertData?.content)
                ? alertData.content
                : []
          setAlerts(alertItems)
          const high = alertItems.filter(a => a.riskLevel === 'HIGH').length
          const medium = alertItems.filter(a => a.riskLevel === 'MEDIUM').length
          setStats({
            totalAlerts: alertItems.length,
            highRiskAlerts: high,
            mediumRiskAlerts: medium,
            unresolvedCount: alertItems.length,
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      connectWebSocket(user.id, localStorage.getItem('token'), (data) => {
        if (data.type === 'NEW_ALERT' || data.type === 'ALERT_NEW') {
          if (data?.data && typeof data.data === 'object') {
            setAlerts(prev => [data.data, ...prev])
            setStats(prev => ({ ...prev, unresolvedCount: prev.unresolvedCount + 1 }))
          }
        }
      })
      return () => disconnectWebSocket()
    }
  }, [user?.id])

  const handleLogout = () => { logout(); navigate('/') }

  const openLinkModal = () => {
    setLinkEmail(''); setLinkPassword(''); setLinkAge(''); setLinkError(''); setLinkSuccess('')
    setShowLinkModal(true)
  }
  const closeLinkModal = () => setShowLinkModal(false)

  const handleLinkChild = async (e) => {
    e.preventDefault()
    setLinkError(''); setLinkSuccess('')
    if (!linkEmail.trim() || !linkPassword.trim()) {
      setLinkError('Please enter both email and password'); return
    }
    try {
      setLinkLoading(true)
      const res = await childAPI.linkChild(linkEmail.trim(), linkPassword, linkAge ? parseInt(linkAge) : undefined)
      const newChild = res.data?.child || res.data
      setLinkSuccess(`${newChild.name} has been added successfully!`)
      // Refresh children list
      await fetchChildren()
      setTimeout(() => { setShowLinkModal(false) }, 1800)
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to link child. Please check credentials.')
    } finally {
      setLinkLoading(false)
    }
  }

  const handleResolveAlert = async (id) => {
    try {
      await alertAPI.resolveAlert(id)
      setAlerts(prev => prev.filter(a => (a._id || a.id) !== id))
      setStats(prev => ({ ...prev, unresolvedCount: Math.max(0, prev.unresolvedCount - 1), totalAlerts: Math.max(0, prev.totalAlerts - 1) }))
    } catch (e) { console.error(e) }
  }

  // ── View Activity ──────────────────────────────────────────────────────────
  const openActivityModal = async (child) => {
    setActivityChild(child)
    setActivityMessages([])
    setActivityLoading(true)
    try {
      const { messageAPI } = await import('../services/api')
      const msgRes = await messageAPI.getChildMessages(child._id).catch(() => ({ data: [] }))
      const msgs = Array.isArray(msgRes.data) ? msgRes.data : msgRes.data?.messages || []
      setActivityMessages(msgs)
    } catch (e) { console.error(e) }
    finally { setActivityLoading(false) }
  }
  const closeActivityModal = () => { setActivityChild(null); setActivityMessages([]) }

  // ── Remove Child ───────────────────────────────────────────────────────────
  const openRemoveModal  = (child) => setRemoveChild(child)
  const closeRemoveModal = () => setRemoveChild(null)
  const handleRemoveChild = async () => {
    if (!removeChild) return
    try {
      setRemoveLoading(true)
      await childAPI.removeChild(removeChild._id)
      // Refresh children list
      await fetchChildren()
      setRemoveChild(null)
    } catch (e) { console.error(e) }
    finally { setRemoveLoading(false) }
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: AlertTriangle,   label: 'Alerts' },
    { icon: Users,           label: 'Children' },
    { icon: FileText,        label: 'Activity Logs' },
    { icon: Globe,           label: 'Browsing Activity' },
    { icon: Bell,            label: 'Notifications' },
    { icon: Settings,        label: 'Settings' },
  ]

  // Compute Weekly Risk Trend from real alerts grouped by day
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const trendData = dayLabels.map(day => ({
    day: day.slice(0, 3),
    alerts: alerts.filter(a => {
      const d = new Date(a.createdAt)
      return dayLabels[d.getDay()] === day
    }).length,
  }))

  // Most recent activity timestamp across all children
  const lastActivityMs = children.reduce((best, c) => {
    const t = c.lastActivityTime ? new Date(c.lastActivityTime).getTime() : 0
    return t > best ? t : best
  }, 0)
  const lastActivityLabel = (() => {
    if (!lastActivityMs) return children.length > 0 ? 'No activity yet' : '—'
    const diff = Math.floor((Date.now() - lastActivityMs) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} min ago`
    const hrs = Math.floor(diff / 60)
    if (hrs < 24) return `${hrs} hr ago`
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`
  })()

  const statCards = [
    {
      label: 'Total Alerts', value: stats.totalAlerts,
      right: (
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
          <polyline points="0,25 15,18 30,20 45,10 60,5" stroke="#3b82f6" strokeWidth="2" fill="none"/>
        </svg>
      ),
    },
    {
      label: 'High Risk Alerts', value: stats.highRiskAlerts, barColor: '#ef4444',
      right: (
        <div style={{ width:40,height:40,borderRadius:'50%',background:'rgba(239,68,68,0.15)',border:'2px solid rgba(239,68,68,0.4)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ width:16,height:16,borderRadius:'50%',background:'#ef4444' }} />
        </div>
      ),
    },
    {
      label: 'Medium Risk Alerts', value: stats.mediumRiskAlerts, barColor: '#f59e0b',
      right: (
        <div style={{ width:40,height:40,borderRadius:'50%',background:'rgba(245,158,11,0.15)',border:'2px solid rgba(245,158,11,0.4)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ width:16,height:16,borderRadius:'50%',background:'#f59e0b' }} />
        </div>
      ),
    },
    {
      label: 'Last Activity', value: lastActivityLabel,
      right: (
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
          <polyline points="0,20 15,22 30,15 45,18 60,10" stroke="#3b82f6" strokeWidth="2" fill="none"/>
        </svg>
      ),
    },
  ]

  const recentAlerts = alerts.slice(0, 5).map(a => ({
    child:   a.childName || 'Unknown',
    message: a.messageContent || '',
    risk:    a.riskLevel || 'LOW',
    time:    a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
    id:      a.id || a._id,
  }))
  const avatarColors = [['#1d4ed8','#3b82f6'],['#7c3aed','#a78bfa'],['#0891b2','#38bdf8'],['#059669','#34d399']]

  const card = {
    background:'rgba(10,20,50,0.7)',
    border:'1px solid rgba(59,130,246,0.15)',
    backdropFilter:'blur(12px)',
    borderRadius:16,
    padding:20,
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#060e20', fontFamily:'Inter,sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(5,12,28,0.97)', borderRight:'1px solid rgba(59,130,246,0.12)', minHeight:'100vh' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 20px', borderBottom:'1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', boxShadow:'0 4px 12px rgba(59,130,246,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Shield style={{ width:20, height:20, color:'white' }} />
          </div>
          <span style={{ color:'white', fontWeight:700, fontSize:15, letterSpacing:'0.03em' }}>SafeMonitor</span>
        </div>

        <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 }}>
          {navItems.map(({ icon, label }) => (
            <NavItem key={label} icon={icon} label={label} active={activeNav===label}
              onClick={() => setActiveNav(label)} />
          ))}
        </nav>

        <div style={{ padding:'12px 12px 20px', borderTop:'1px solid rgba(59,130,246,0.1)' }}>
          <NavItem icon={LogOut} label="Logout" danger onClick={handleLogout} />
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Header */}
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 28px', background:'rgba(5,12,28,0.6)', borderBottom:'1px solid rgba(59,130,246,0.1)', backdropFilter:'blur(12px)', flexShrink:0 }}>
          <h1 style={{ color:'white', fontWeight:700, fontSize:20, margin:0, letterSpacing:'-0.01em' }}>Parent Dashboard</h1>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Notifications bell */}
            <button onClick={() => setActiveNav('Notifications')} style={{ position:'relative', padding:8, borderRadius:10, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', cursor:'pointer' }} title="Notifications">
              <Bell style={{ width:20, height:20, color:'#60a5fa' }} />
            </button>
            {/* Alerts triangle */}
            <button onClick={() => setActiveNav('Alerts')} style={{ position:'relative', padding:8, borderRadius:10, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', cursor:'pointer' }} title="Alerts">
              <AlertTriangle style={{ width:20, height:20, color:'#fbbf24' }} />
              {stats.unresolvedCount > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, minWidth:18, height:18, background:'#ef4444', color:'white', fontSize:10, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', fontWeight:700 }}>
                  {stats.unresolvedCount > 9 ? '9+' : stats.unresolvedCount}
                </span>
              )}
            </button>
            <button onClick={()=>navigate('/settings')} style={{ padding:8, borderRadius:10, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', cursor:'pointer' }}>
              <Settings style={{ width:20, height:20, color:'#60a5fa' }} />
            </button>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'white', fontSize:14, boxShadow:'0 4px 12px rgba(59,130,246,0.3)' }}>
              {user?.name?.charAt(0)?.toUpperCase()||'U'}
            </div>
          </div>
        </header>

        <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

          {/* ── Panel Router ── */}
          {activeNav === 'Alerts'        && <AlertsPanel />}
          {activeNav === 'Children'      && <ChildrenPanel children={children} onChildrenChange={fetchChildren} />}
          {activeNav === 'Activity Logs' && <ActivityLogsPanel />}          {activeNav === 'Browsing Activity' && <BrowsingActivityPanel />}          {activeNav === 'Notifications' && <NotificationsPanel />}
          {activeNav === 'Settings'      && <SettingsPanel />}

          {/* ── Dashboard Overview (default) ── */}
          {activeNav === 'Dashboard' && <>

          {/* No-children empty state */}
          {!loading && children.length === 0 && (
            <div style={{ ...card, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', gap:0 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(59,130,246,0.08)', border:'2px solid rgba(59,130,246,0.18)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <Shield style={{ width:36, height:36, color:'#1e3a5f' }} />
              </div>
              <h2 style={{ color:'white', fontWeight:700, fontSize:20, margin:'0 0 10px' }}>No Children Connected</h2>
              <p style={{ color:'#64748b', fontSize:14, margin:'0 0 24px', maxWidth:400, lineHeight:1.7 }}>
                Connect a child account to start monitoring their activity, receive safety alerts, and view real-time risk analysis.
              </p>
              <button onClick={openLinkModal}
                style={{ background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', padding:'11px 28px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(59,130,246,0.4)', display:'flex', alignItems:'center', gap:8 }}>
                <Plus style={{ width:16, height:16 }} /> Connect a Child
              </button>
            </div>
          )}

          {/* Data sections — only when children are connected */}
          {children.length > 0 && <>

          {/* Stat Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {statCards.map((s,i)=>(
              <div key={i} style={card}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <p style={{ color:'#94a3b8', fontSize:12, fontWeight:500, margin:'0 0 6px' }}>{s.label}</p>
                    <p style={{ color:'white', fontSize: typeof s.value === 'string' ? 16 : 30, fontWeight:900, margin:0, lineHeight:1.2 }}>
                      {s.value}
                    </p>
                  </div>
                  {s.right}
                </div>
                {s.barColor && (
                  <div style={{ height:4, borderRadius:4, background:s.barColor, opacity:0.7, width:'75%', marginTop:4 }} />
                )}
              </div>
            ))}
          </div>

          {/* Chart + Table */}
          <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>

            {/* Weekly Risk Trend */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <TrendingUp style={{ width:16, height:16, color:'#60a5fa' }} />
                <h2 style={{ color:'white', fontWeight:600, fontSize:14, margin:0 }}>Weekly Risk Trend</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top:5, right:5, bottom:0, left:-20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                  <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} domain={[0,7]} ticks={[0,1,2,3,4,5,6]} />
                  <Tooltip content={<BlueTooltip />} />
                  <Line type="monotone" dataKey="alerts" stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ fill:'#3b82f6', r:4, strokeWidth:0 }}
                    activeDot={{ r:6, fill:'#60a5fa', strokeWidth:0 }} name="Alerts" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Alerts */}
            <div style={card}>
              <h2 style={{ color:'white', fontWeight:600, fontSize:14, margin:'0 0 14px' }}>Recent Alerts</h2>
              {recentAlerts.length === 0 ? (
                <div style={{ textAlign:'center', padding:'28px 20px' }}>
                  <CheckCircle style={{ width:32, height:32, color:'#1e3a5f', display:'block', margin:'0 auto 10px' }} />
                  <p style={{ color:'#64748b', fontSize:13, margin:0 }}>No alerts yet — all activity looks safe</p>
                </div>
              ) : (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 0.8fr 0.8fr 0.6fr', gap:6, marginBottom:8 }}>
                    {['Child','Message','Risk','Time','Actions'].map(h=>(
                      <span key={h} style={{ color:'#475569', fontSize:11, fontWeight:600 }}>{h}</span>
                    ))}
                  </div>
                  <div>
                    {recentAlerts.map((row,i)=>(
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 0.8fr 0.8fr 0.6fr', gap:6, alignItems:'center', padding:'8px 4px', borderBottom: i<recentAlerts.length-1?'1px solid rgba(59,130,246,0.07)':'none' }}>
                        <span style={{ color:'white', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.child}</span>
                        <span style={{ color:'#94a3b8', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.message}</span>
                        <RiskBadge level={row.risk} />
                        <span style={{ color:'#64748b', fontSize:11 }}>{row.time}</span>
                        <button onClick={()=>row.id&&handleResolveAlert(row.id)}
                          style={{ background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          </> /* end data sections */}

          {/* Manage Children */}
          <div style={card}>
            <h2 style={{ color:'white', fontWeight:600, fontSize:14, margin:'0 0 16px' }}>Manage Children</h2>
            {children.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'30px 20px' }}>
                <Users style={{ width:40, height:40, color:'#1e3a5f', display:'block', margin:'0 auto 12px' }} />
                <p style={{ color:'#94a3b8', fontSize:13, margin:'0 0 12px' }}>No children linked yet. Add a child to start monitoring.</p>
                <button onClick={openLinkModal}
                  style={{ background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  + Add Child
                </button>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:14 }}>
              {children.map((child,i)=>(
                <div key={child._id||i} style={{ background:'rgba(15,30,65,0.8)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:9 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${avatarColors[i%avatarColors.length][0]},${avatarColors[i%avatarColors.length][1]})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'white', fontSize:18, flexShrink:0 }}>
                      {child.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:'white', fontWeight:600, fontSize:13, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{child.name}</p>
                      <p style={{ color:'#94a3b8', fontSize:12, margin:0 }}>Age {child.ageGroup||child.age||'--'}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Clock style={{ width:10, height:10, color:'#475569', flexShrink:0 }} />
                    <p style={{ color:'#64748b', fontSize:10, margin:0 }}>
                      {child.lastActivityTime ? `Last active: ${new Date(child.lastActivityTime).toLocaleString()}` : 'No activity yet'}
                    </p>
                  </div>
                  {/* View Activity */}
                  <button onClick={()=>openActivityModal(child)}
                    style={{ background:'rgba(37,99,235,0.2)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa', fontSize:12, fontWeight:600, padding:'7px 0', borderRadius:8, cursor:'pointer', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <Eye style={{ width:13, height:13 }} /> View Activity
                  </button>
                  {/* Add Child */}
                  <button onClick={openLinkModal}
                    style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:'#34d399', fontSize:12, fontWeight:600, padding:'7px 0', borderRadius:8, cursor:'pointer', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <Plus style={{ width:13, height:13 }} /> Add Child
                  </button>
                  {/* Remove Child */}
                  <button onClick={()=>openRemoveModal(child)}
                    style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', fontSize:12, fontWeight:600, padding:'7px 0', borderRadius:8, cursor:'pointer', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <Trash2 style={{ width:13, height:13 }} /> Remove Child
                  </button>
                </div>
              ))}

              <button onClick={openLinkModal}
                style={{ background:'rgba(15,30,65,0.5)', border:'2px dashed rgba(59,130,246,0.25)', borderRadius:14, padding:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', minHeight:148 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(59,130,246,0.1)', border:'2px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Plus style={{ width:24, height:24, color:'#60a5fa' }} />
                </div>
                <p style={{ color:'#94a3b8', fontSize:13, fontWeight:600, margin:0 }}>Add Child</p>
              </button>
            </div>
          </div>

          </> /* end Dashboard */}

        </div>
      </main>

      {/* ── View Activity Modal ─────────────────────────────────────────────── */}
      {activityChild && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
          onClick={e=>{ if(e.target===e.currentTarget) closeActivityModal() }}>
          <div style={{ background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:20, padding:28, width:'100%', maxWidth:560, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 60px rgba(0,0,0,0.6)', position:'relative' }}>
            <button onClick={closeActivityModal} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.05)', border:'none', color:'#94a3b8', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X style={{ width:16, height:16 }} />
            </button>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(59,130,246,0.4)' }}>
                <Activity style={{ width:22, height:22, color:'white' }} />
              </div>
              <div>
                <h2 style={{ color:'white', fontWeight:700, fontSize:17, margin:0 }}>{activityChild.name}'s Activity</h2>
                <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>Recent messages &amp; risk analysis</p>
              </div>
            </div>
            {/* Messages list */}
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, paddingRight:4 }}>
              {activityLoading ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
                </div>
              ) : activityMessages.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <CheckCircle style={{ width:40, height:40, color:'#22c55e', margin:'0 auto 12px', display:'block' }} />
                  <p style={{ color:'white', fontWeight:600, fontSize:14, margin:0 }}>No messages yet</p>
                  <p style={{ color:'#475569', fontSize:12, marginTop:6 }}>No activity recorded for this child</p>
                </div>
              ) : (
                activityMessages.map((msg, i) => {
                  const riskColor = msg.riskLevel==='HIGH' ? '#f87171' : msg.riskLevel==='MEDIUM' ? '#fbbf24' : '#34d399'
                  const riskBg   = msg.riskLevel==='HIGH' ? 'rgba(239,68,68,0.1)' : msg.riskLevel==='MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'
                  return (
                    <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(59,130,246,0.1)', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                        <p style={{ color:'white', fontSize:13, margin:0, fontWeight:500, flex:1, lineHeight:1.5 }}>"{msg.content || msg.messageContent || msg.message}"</p>
                        <span style={{ background:riskBg, color:riskColor, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:5, flexShrink:0 }}>{msg.riskLevel||'SAFE'}</span>
                      </div>
                      {msg.explanation && <p style={{ color:'#64748b', fontSize:11, margin:0 }}>{msg.explanation}</p>}
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Clock style={{ width:10, height:10, color:'#475569' }} />
                        <span style={{ color:'#475569', fontSize:10 }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {/* Footer stats */}
            {activityMessages.length > 0 && (
              <div style={{ display:'flex', gap:8, marginTop:16, paddingTop:14, borderTop:'1px solid rgba(59,130,246,0.1)' }}>
                {[
                  { label:'Total',     value: activityMessages.length,                                                             color:'#60a5fa' },
                  { label:'High Risk', value: activityMessages.filter(m=>m.riskLevel==='HIGH').length,                            color:'#f87171' },
                  { label:'Medium',    value: activityMessages.filter(m=>m.riskLevel==='MEDIUM').length,                          color:'#fbbf24' },
                  { label:'Safe',      value: activityMessages.filter(m=>!m.riskLevel||['LOW','SAFE'].includes(m.riskLevel)).length, color:'#34d399' },
                ].map((s,i)=>(
                  <div key={i} style={{ flex:1, background:'rgba(59,130,246,0.06)', borderRadius:8, padding:'8px 0', textAlign:'center' }}>
                    <p style={{ color:s.color, fontWeight:700, fontSize:16, margin:0 }}>{s.value}</p>
                    <p style={{ color:'#475569', fontSize:10, margin:'2px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Remove Child Confirm ─────────────────────────────────────────────── */}
      {removeChild && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
          onClick={e=>{ if(e.target===e.currentTarget) closeRemoveModal() }}>
          <div style={{ background:'rgba(8,18,45,0.98)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 25px 60px rgba(0,0,0,0.6)', position:'relative' }}>
            <button onClick={closeRemoveModal} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.05)', border:'none', color:'#94a3b8', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X style={{ width:16, height:16 }} />
            </button>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(239,68,68,0.12)', border:'2px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Trash2 style={{ width:24, height:24, color:'#f87171' }} />
              </div>
              <h2 style={{ color:'white', fontWeight:700, fontSize:17, margin:0 }}>Remove Child</h2>
              <p style={{ color:'#94a3b8', fontSize:13, margin:'10px 0 0', lineHeight:1.5 }}>
                Are you sure you want to remove <strong style={{ color:'white' }}>{removeChild.name}</strong> from your account?
              </p>
              <p style={{ color:'#ef4444', fontSize:11, marginTop:8 }}>This action cannot be undone.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={closeRemoveModal}
                style={{ flex:1, padding:'10px 0', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleRemoveChild} disabled={removeLoading}
                style={{ flex:1, padding:'10px 0', borderRadius:10, background: removeLoading?'rgba(239,68,68,0.3)':'rgba(239,68,68,0.85)', border:'none', color:'white', fontSize:14, fontWeight:700, cursor: removeLoading?'not-allowed':'pointer', boxShadow: removeLoading?'none':'0 4px 14px rgba(239,68,68,0.3)', transition:'all 0.2s' }}>
                {removeLoading ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Child Modal ─────────────────────────────────────────────────── */}
      {showLinkModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }}
          onClick={(e)=>{ if(e.target===e.currentTarget) closeLinkModal() }}>
          <div style={{ background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:20, padding:32, width:'100%', maxWidth:420, boxShadow:'0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)', position:'relative' }}>

            {/* Close */}
            <button onClick={closeLinkModal} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'none', color:'#94a3b8', width:32, height:32, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, lineHeight:1 }}>✕</button>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(59,130,246,0.4)' }}>
                <Users style={{ width:22, height:22, color:'white' }} />
              </div>
              <div>
                <h2 style={{ color:'white', fontWeight:700, fontSize:17, margin:0 }}>Add Child Account</h2>
                <p style={{ color:'#64748b', fontSize:12, margin:0, marginTop:2 }}>Enter your child's registered credentials</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLinkChild} style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Email */}
              <div>
                <label style={{ display:'block', color:'#94a3b8', fontSize:12, fontWeight:600, marginBottom:6 }}>Child's Email Address</label>
                <input
                  type="email"
                  value={linkEmail}
                  onChange={e=>setLinkEmail(e.target.value)}
                  placeholder="child@example.com"
                  required
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(59,130,246,0.2)', color:'white', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.6)'}
                  onBlur={e=>e.target.style.borderColor='rgba(59,130,246,0.2)'}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display:'block', color:'#94a3b8', fontSize:12, fontWeight:600, marginBottom:6 }}>Child's Password</label>
                <input
                  type="password"
                  value={linkPassword}
                  onChange={e=>setLinkPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(59,130,246,0.2)', color:'white', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.6)'}
                  onBlur={e=>e.target.style.borderColor='rgba(59,130,246,0.2)'}
                />
              </div>

              {/* Age */}
              <div>
                <label style={{ display:'block', color:'#94a3b8', fontSize:12, fontWeight:600, marginBottom:6 }}>Child's Age <span style={{color:'#475569'}}>(optional)</span></label>
                <input
                  type="number"
                  value={linkAge}
                  onChange={e=>setLinkAge(e.target.value)}
                  placeholder="e.g. 12"
                  min="1" max="18"
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(59,130,246,0.2)', color:'white', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.6)'}
                  onBlur={e=>e.target.style.borderColor='rgba(59,130,246,0.2)'}
                />
              </div>

              {/* Error */}
              {linkError && (
                <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>
                  {linkError}
                </div>
              )}

              {/* Success */}
              {linkSuccess && (
                <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:10, padding:'10px 14px', color:'#86efac', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                  <CheckCircle style={{ width:16, height:16, flexShrink:0 }} />
                  {linkSuccess}
                </div>
              )}

              {/* Info note */}
              <p style={{ color:'#475569', fontSize:11, margin:0, lineHeight:1.5 }}>
                ℹ️ The child must have a registered account with the role set to <strong style={{color:'#60a5fa'}}>Child</strong>.
              </p>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="button" onClick={closeLinkModal}
                  style={{ flex:1, padding:'10px 0', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={linkLoading}
                  style={{ flex:1, padding:'10px 0', borderRadius:10, background: linkLoading?'rgba(37,99,235,0.5)':'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', fontSize:14, fontWeight:700, cursor: linkLoading?'not-allowed':'pointer', boxShadow: linkLoading?'none':'0 4px 14px rgba(59,130,246,0.4)', transition:'all 0.2s' }}>
                  {linkLoading ? 'Verifying…' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard
