import React, { useState, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, X, Activity, Globe, Settings, User, Shield, Mail, AlertCircle } from 'lucide-react'
import { notificationAPI } from '../../services/api'

const card = { background:'rgba(10,20,50,0.7)', border:'1px solid rgba(59,130,246,0.15)', backdropFilter:'blur(12px)', borderRadius:16, padding:20 }

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

const typeConfig = {
  ACTIVITY_UPDATE: { 
    icon: Activity, 
    color:'#60a5fa', 
    bg:'rgba(30,58,138,0.2)', 
    border:'rgba(59,130,246,0.2)', 
    label:'Activity Update' 
  },
  WEBSITE_ACCESS: { 
    icon: Globe, 
    color:'#a78bfa', 
    bg:'rgba(91,33,182,0.2)', 
    border:'rgba(167,139,250,0.2)', 
    label:'Website Access' 
  },
  SYSTEM_MESSAGE: { 
    icon: Shield, 
    color:'#34d399', 
    bg:'rgba(20,83,45,0.2)', 
    border:'rgba(52,211,153,0.15)', 
    label:'System Message' 
  },
  ACCOUNT_CHANGE: { 
    icon: User, 
    color:'#fbbf24', 
    bg:'rgba(120,53,15,0.2)', 
    border:'rgba(251,191,36,0.2)', 
    label:'Account Change' 
  },
  PARENT_ACTION: { 
    icon: Settings, 
    color:'#f87171', 
    bg:'rgba(127,29,29,0.2)', 
    border:'rgba(239,68,68,0.2)', 
    label:'Parent Action' 
  }
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const filters = {
        limit: 100,
        ...(filter !== 'ALL' && { type: filter })
      }
      const res = await notificationAPI.getNotifications(filters)
      const items = res.data?.notifications || res.data || []
      setNotifications(items)

      // Get unread count
      const countRes = await notificationAPI.getUnreadCount()
      setUnreadCount(countRes.data?.count || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications(prev => 
        prev.map(n => n._id === id || n.id === id ? { ...n, status: 'READ' } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'READ' }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationAPI.deleteNotification(id)
      setNotifications(prev => prev.filter(n => (n._id || n.id) !== id))
      // If it was unread, decrease count
      const notification = notifications.find(n => (n._id || n.id) === id)
      if (notification?.status === 'UNREAD') {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const filterButtons = [
    { key: 'ALL', label: 'All Notifications' },
    { key: 'ACTIVITY_UPDATE', label: 'Activity Updates' },
    { key: 'WEBSITE_ACCESS', label: 'Website Access' },
    { key: 'SYSTEM_MESSAGE', label: 'System Messages' },
    { key: 'ACCOUNT_CHANGE', label: 'Account Changes' },
    { key: 'PARENT_ACTION', label: 'Parent Actions' }
  ]

  const readCount = notifications.filter(n => n.status === 'READ').length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h2 style={{ color:'white', fontWeight:700, fontSize:20, margin:0 }}>Notifications</h2>
            {unreadCount > 0 && (
              <span style={{ background:'linear-gradient(135deg,#ef4444,#f87171)', color:'white', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:12, boxShadow:'0 2px 8px rgba(239,68,68,0.4)' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead}
            style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>
            <CheckCheck style={{width:15,height:15}}/> Mark all read
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12 }}>
        {[
          { label:'Total',   value:notifications.length,  color:'#60a5fa' },
          { label:'Unread',  value:unreadCount,   color:'#f87171' },
          { label:'Read',    value:readCount, color:'#34d399' },
        ].map((s,i) => (
          <div key={i} style={{ ...card, padding:14 }}>
            <p style={{ color:'#64748b', fontSize:11, margin:'0 0 4px' }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:22, fontWeight:900, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {filterButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            style={{
              padding:'8px 14px',
              borderRadius:8,
              border:'1px solid rgba(59,130,246,0.2)',
              background: filter === btn.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
              color: filter === btn.key ? '#60a5fa' : '#94a3b8',
              fontSize:12,
              fontWeight:600,
              cursor:'pointer',
              transition:'all 0.2s'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={card}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px 20px' }}>
            <Bell style={{ width:48, height:48, color:'#1e3a5f', display:'block', margin:'0 auto 14px' }} />
            <p style={{ color:'white', fontWeight:600, fontSize:15, margin:0 }}>No notifications</p>
            <p style={{ color:'#475569', fontSize:13, marginTop:6 }}>
              {filter === 'ALL' ? "You're all caught up!" : `No ${filterButtons.find(f => f.key === filter)?.label.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {notifications.map((n, i) => {
              const id = n._id || n.id || i
              const cfg = typeConfig[n.type] || typeConfig.SYSTEM_MESSAGE
              const Icon = cfg.icon
              const isUnread = n.status === 'UNREAD'
              
              return (
                <div key={id}
                  onClick={() => isUnread && handleMarkAsRead(id)}
                  style={{ 
                    display:'flex', 
                    alignItems:'flex-start', 
                    gap:14, 
                    padding:'14px 8px', 
                    borderBottom: i < notifications.length-1 ? '1px solid rgba(59,130,246,0.08)' : 'none', 
                    cursor: isUnread ? 'pointer' : 'default', 
                    transition:'background 0.15s', 
                    borderRadius:8, 
                    position:'relative',
                    background: isUnread ? 'rgba(59,130,246,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => isUnread && (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
                  onMouseLeave={e => isUnread && (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                >
                  {isUnread && (
                    <span style={{ 
                      position:'absolute', 
                      left:-4, 
                      top:'50%', 
                      transform:'translateY(-50%)', 
                      width:8, 
                      height:8, 
                      borderRadius:'50%', 
                      background:'#3b82f6', 
                      boxShadow:'0 0 6px #3b82f6' 
                    }} />
                  )}
                  <div style={{ 
                    width:40, 
                    height:40, 
                    borderRadius:10, 
                    background:cfg.bg, 
                    border:`1px solid ${cfg.border}`, 
                    display:'flex', 
                    alignItems:'center', 
                    justifyContent:'center', 
                    flexShrink:0 
                  }}>
                    <Icon style={{ width:18, height:18, color:cfg.color }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ color:cfg.color, fontSize:12, fontWeight:700 }}>{cfg.label}</span>
                      <span style={{ color:'#475569', fontSize:11 }}>· {timeAgo(n.createdAt)}</span>
                      {isUnread && (
                        <span style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa', fontSize:10, padding:'2px 7px', borderRadius:5, fontWeight:700 }}>NEW</span>
                      )}
                    </div>
                    <p style={{ 
                      color: isUnread ? '#e2e8f0' : '#94a3b8', 
                      fontSize:13, 
                      margin:'0 0 4px', 
                      lineHeight:1.5,
                      fontWeight: isUnread ? 500 : 400
                    }}>
                      {n.message}
                    </p>
                    {n.childName && (
                      <span style={{ 
                        color:'#3b82f6', 
                        fontSize:11, 
                        fontWeight:600, 
                        display:'inline-block',
                        background:'rgba(59,130,246,0.1)',
                        padding:'2px 8px',
                        borderRadius:6,
                        marginTop:3
                      }}>
                        👤 {n.childName}
                      </span>
                    )}
                    {n.metadata?.websiteDomain && (
                      <span style={{ 
                        color:'#a78bfa', 
                        fontSize:11, 
                        fontWeight:600, 
                        display:'inline-block',
                        background:'rgba(167,139,250,0.1)',
                        padding:'2px 8px',
                        borderRadius:6,
                        marginTop:3,
                        marginLeft: n.childName ? 6 : 0
                      }}>
                        🌐 {n.metadata.websiteDomain}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={e => { e.stopPropagation(); handleDelete(id) }}
                    style={{ 
                      flexShrink:0, 
                      background:'rgba(239,68,68,0.08)', 
                      border:'1px solid rgba(239,68,68,0.2)', 
                      color:'#f87171', 
                      width:30, 
                      height:30, 
                      borderRadius:7, 
                      cursor:'pointer', 
                      display:'flex', 
                      alignItems:'center', 
                      justifyContent:'center',
                      transition:'all 0.2s'
                    }}
                    title="Delete notification"
                  >
                    <Trash2 style={{ width:13, height:13 }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
