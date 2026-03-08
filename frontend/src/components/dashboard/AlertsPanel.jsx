import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Bell, Search, Filter, Eye, ShieldCheck, Clock, X, Globe, Send } from 'lucide-react'
import { alertAPI } from '../../services/api'

const RiskBadge = ({ level }) => {
  const cfg = {
    HIGH:   { bg: 'rgba(127,29,29,0.75)',  color: '#fca5a5', text: 'High' },
    MEDIUM: { bg: 'rgba(120,53,15,0.75)',  color: '#fcd34d', text: 'Medium' },
    LOW:    { bg: 'rgba(20,83,45,0.75)',   color: '#86efac', text: 'Low' },
    SAFE:   { bg: 'rgba(20,83,45,0.75)',   color: '#86efac', text: 'Safe' },
  }
  const c = cfg[level] || cfg.LOW
  return <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{c.text}</span>
}

const StatusBadge = ({ status }) => {
  const cfg = {
    RESOLVED:     { bg: 'rgba(20,83,45,0.5)',   color: '#86efac', text: 'Resolved' },
    ACKNOWLEDGED: { bg: 'rgba(30,58,138,0.5)',  color: '#93c5fd', text: 'Acknowledged' },
    NEW:          { bg: 'rgba(120,53,15,0.5)',  color: '#fcd34d', text: 'New' },
    FALSE_POSITIVE: { bg: 'rgba(100,116,139,0.5)', color: '#cbd5e1', text: 'False Positive' },
  }
  const c = cfg[status] || cfg.NEW
  return <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>{c.text}</span>
}

const AlertTypeBadge = ({ type }) => {
  const cfg = {
    SUSPICIOUS_MESSAGE:  { bg: 'rgba(168,85,247,0.15)', color: '#d8b4fe', text: '💬 Message' },
    DANGEROUS_WEBSITE:   { bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', text: '🌐 Website' },
    UNUSUAL_BEHAVIOR:    { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', text: '⚠️ Behavior' },
  }
  const c = cfg[type] || cfg.SUSPICIOUS_MESSAGE
  return <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>{c.text}</span>
}

const card = { background: 'rgba(10,20,50,0.7)', border: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: 20 }

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [blockModal, setBlockModal] = useState(null)
  const [warningModal, setWarningModal] = useState(null)
  const [warningMessage, setWarningMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Load alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true)
        const filters = {
          status: 'NEW',
          limit: 50,
          page: 0,
          ...(filter !== 'ALL' && { riskLevel: filter }),
          ...(search && { search })
        }
        const res = await alertAPI.getParentAlerts(filters)
        const data = res.data
        
        // Handle pagination response
        if (data.alerts && data.pagination) {
          setAlerts(data.alerts)
        } else if (Array.isArray(data)) {
          setAlerts(data)
        } else {
          setAlerts([])
        }

        // Load stats
        const statsRes = await alertAPI.getAlertStats()
        if (statsRes.data) {
          setStats(statsRes.data)
        }
      } catch (e) {
        console.error('Error loading alerts:', e)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }
    loadAlerts()
  }, [filter, search])

  const handleResolve = async (id) => {
    try {
      setSaving(true)
      await alertAPI.resolveAlert(id)
      setAlerts(prev => prev.map(a => a._id === id || a.id === id ? { ...a, status: 'RESOLVED' } : a))
      if (selected?._id === id || selected?.id === id) {
        setSelected(prev => ({ ...prev, status: 'RESOLVED' }))
      }
    } catch (e) {
      console.error('Error resolving alert:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleAcknowledge = async (id) => {
    try {
      setSaving(true)
      await alertAPI.acknowledgeAlert(id)
      setAlerts(prev => prev.map(a => a._id === id || a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      if (selected?._id === id || selected?.id === id) {
        setSelected(prev => ({ ...prev, status: 'ACKNOWLEDGED' }))
      }
    } catch (e) {
      console.error('Error acknowledging alert:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleBlockWebsite = async (alert) => {
    try {
      setSaving(true)
      const domain = alert.websiteDomain || (alert.messageContent?.includes('http') ? alert.messageContent : null)
      if (!domain) {
        alert('Could not determine domain to block')
        return
      }
      await alertAPI.blockWebsite(alert._id || alert.id, domain)
      setAlerts(prev => prev.map(a => (a._id === alert._id || a.id === alert.id) ? { ...a, websiteBlocked: true } : a))
      setBlockModal(null)
      if (selected) setSelected(prev => ({ ...prev, websiteBlocked: true }))
    } catch (e) {
      console.error('Error blocking website:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleSendWarning = async (id) => {
    try {
      if (!warningMessage.trim()) {
        alert('Please enter a warning message')
        return
      }
      setSaving(true)
      await alertAPI.sendWarningNotification(id, warningMessage)
      setAlerts(prev => prev.map(a => (a._id === id || a.id === id) ? { ...a, warningNotificationSent: true } : a))
      if (selected?._id === id || selected?.id === id) {
        setSelected(prev => ({ ...prev, warningNotificationSent: true }))
      }
      setWarningModal(null)
      setWarningMessage('')
    } catch (e) {
      console.error('Error sending warning:', e)
    } finally {
      setSaving(false)
    }
  }

  const filtered = alerts.filter(a => {
    const matchRisk = filter === 'ALL' || a.riskLevel === filter
    const q = search.toLowerCase()
    const matchSearch = !q || 
      (a.childId?.name || a.childName || '').toLowerCase().includes(q) || 
      (a.messageContent || '').toLowerCase().includes(q) ||
      (a.websiteDomain || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    return matchRisk && matchSearch
  })

  const alertCount = stats?.totalAlerts || alerts.length
  const highCount = stats?.highRisk || alerts.filter(a => a.riskLevel === 'HIGH').length
  const mediumCount = stats?.mediumRisk || alerts.filter(a => a.riskLevel === 'MEDIUM').length
  const resolvedCount = stats?.resolved || alerts.filter(a => a.status === 'RESOLVED').length
  const unresolvedCount = stats?.unresolved || alerts.filter(a => a.status !== 'RESOLVED').length

  const statCards = [
    { label: 'Total Alerts', value: alertCount, color: '#60a5fa', icon: Bell },
    { label: 'High Risk', value: highCount, color: '#f87171', icon: AlertTriangle },
    { label: 'Medium Risk', value: mediumCount, color: '#fbbf24', icon: Filter },
    { label: 'Resolved', value: resolvedCount, color: '#34d399', icon: CheckCircle },
    { label: 'Unresolved', value: unresolvedCount, color: '#f87171', icon: AlertTriangle },
  ]

  // Get display name for child
  const getChildName = (alert) => {
    if (alert.childId?.name) return alert.childId.name
    if (alert.childName) return alert.childName
    return '—'
  }

  // Get alert description/content
  const getAlertContent = (alert) => {
    if (alert.messageContent) return alert.messageContent.substring(0, 60)
    if (alert.websiteDomain) return `Visited: ${alert.websiteDomain}`
    if (alert.description) return alert.description.substring(0, 60)
    return '—'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: 0 }}>🚨 Alerts Center</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Monitor and manage all flagged risky activities</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>
            ⚡ {unresolvedCount} Unresolved
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div 
              key={i} 
              style={{ 
                ...card, 
                padding: 16, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: filter === s.label.split(' ')[0] ? 1 : 0.7,
                transform: 'scale(1)',
              }}
              onClick={() => {
                if (s.label === 'High Risk') setFilter('HIGH')
                else if (s.label === 'Medium Risk') setFilter('MEDIUM')
                else if (s.label === 'Low Risk') setFilter('LOW')
                else setFilter('ALL')
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 6px', fontWeight: 600 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: 28, fontWeight: 900, margin: 0 }}>{s.value}</p>
                </div>
                <Icon style={{ width: 32, height: 32, color: s.color, opacity: 0.6 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters + Search */}
      <div style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', 
                borderRadius: 8, 
                fontSize: 12, 
                fontWeight: 600, 
                cursor: 'pointer', 
                border: 'none', 
                transition: 'all 0.15s',
                background: filter === f ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? 'white' : '#64748b',
                boxShadow: filter === f ? '0 2px 10px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              {f === 'ALL' ? '📊 All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#475569' }} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by child, message, domain…"
            style={{
              width: '100%', 
              padding: '7px 12px 7px 32px', 
              borderRadius: 8, 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(59,130,246,0.15)', 
              color: 'white', 
              fontSize: 13, 
              outline: 'none', 
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.9fr 1.5fr 0.9fr 0.8fr 0.7fr 1.2fr', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          {['Type', 'Child', 'Description', 'Risk', 'Score', 'Status', 'Actions'].map(h => (
            <span key={h} style={{ color: '#475569', fontSize: 11, fontWeight: 700 }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircle style={{ width: 40, height: 40, color: '#22c55e', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>✅ No alerts at this moment</p>
            <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>All is looking good in the system!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            {filtered.map((a, i) => (
              <div 
                key={a._id || a.id || i} 
                style={{
                  display: 'grid', 
                  gridTemplateColumns: '0.9fr 0.9fr 1.5fr 0.9fr 0.8fr 0.7fr 1.2fr', 
                  gap: 12, 
                  alignItems: 'center', 
                  padding: '12px 0', 
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(59,130,246,0.07)' : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <AlertTypeBadge type={a.alertType} />
                <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{getChildName(a)}</span>
                <span style={{ color: '#94a3b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getAlertContent(a)}</span>
                <RiskBadge level={a.riskLevel} />
                <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 700 }}>{a.riskScore ?? '—'}</span>
                <StatusBadge status={a.status} />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      setSelected(a)
                      setDetailModal(true)
                    }}
                    style={{
                      background: 'rgba(59,130,246,0.15)', 
                      border: '1px solid rgba(59,130,246,0.25)', 
                      color: '#60a5fa', 
                      fontSize: 10, 
                      fontWeight: 600, 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 3,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.25)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.15)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <Eye style={{ width: 10, height: 10 }} /> View
                  </button>
                  {a.status !== 'RESOLVED' && (
                    <button 
                      onClick={() => handleResolve(a._id || a.id)}
                      style={{
                        background: 'rgba(34,197,94,0.12)', 
                        border: '1px solid rgba(34,197,94,0.25)', 
                        color: '#34d399', 
                        fontSize: 10, 
                        fontWeight: 600, 
                        padding: '4px 8px', 
                        borderRadius: 6, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(34,197,94,0.25)'
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(34,197,94,0.12)'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <CheckCircle style={{ width: 10, height: 10 }} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && selected && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0,0,0,0.75)', 
            backdropFilter: 'blur(6px)' 
          }}
          onClick={e => { if (e.target === e.currentTarget) setDetailModal(false) }}
        >
          <div style={{
            background: 'rgba(8,18,45,0.98)', 
            border: '1px solid rgba(59,130,246,0.25)', 
            borderRadius: 20, 
            padding: 28, 
            width: '100%', 
            maxWidth: 520, 
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)', 
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button 
              onClick={() => setDetailModal(false)} 
              style={{
                position: 'absolute', 
                top: 14, 
                right: 14, 
                background: 'rgba(255,255,255,0.05)', 
                border: 'none', 
                color: '#94a3b8', 
                width: 30, 
                height: 30, 
                borderRadius: 8, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: 22, height: 22, color: 'white' }} />
              </div>
              <div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>📌 Alert Details</h2>
                <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Full information</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                ['Alert Type', null, <AlertTypeBadge type={selected.alertType} />],
                ['Child', getChildName(selected)],
                ['Risk Level', null, <RiskBadge level={selected.riskLevel} />],
                ['Risk Score', `${selected.riskScore || 0}/100`],
                ['Status', null, <StatusBadge status={selected.status} />],
                ...(selected.messageContent ? [['Message Content', selected.messageContent.substring(0, 200)]] : []),
                ...(selected.websiteDomain ? [['Website Domain', selected.websiteDomain]] : []),
                ...(selected.websiteTitle ? [['Website Title', selected.websiteTitle]] : []),
                ...(selected.description ? [['Description', selected.description]] : []),
                ...(selected.riskExplanation ? [['Risk Explanation', selected.riskExplanation.substring(0, 200)]] : []),
                ['Detected At', selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'],
                ...(selected.resolvedAt ? [['Resolved At', new Date(selected.resolvedAt).toLocaleString()]] : []),
              ].map(([label, value, node], i) => value !== undefined || node ? (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: '1px solid rgba(59,130,246,0.1)', paddingBottom: 12 }}>
                  <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, width: 120, flexShrink: 0, marginTop: 2 }}>{label}</span>
                  {node ? node : <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1, lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</span>}
                </div>
              ) : null)}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.status !== 'RESOLVED' && (
                <>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => handleAcknowledge(selected._id || selected.id)}
                      disabled={saving}
                      style={{
                        flex: 1, 
                        padding: '9px 0', 
                        borderRadius: 10, 
                        background: 'rgba(59,130,246,0.15)', 
                        border: '1px solid rgba(59,130,246,0.3)', 
                        color: '#60a5fa', 
                        fontSize: 13, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        opacity: saving ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => !saving && (e.currentTarget.style.background = 'rgba(59,130,246,0.25)')}
                      onMouseLeave={e => !saving && (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                    >
                      {saving ? '⏳' : '👁️'} Acknowledge
                    </button>
                    <button 
                      onClick={() => handleResolve(selected._id || selected.id)}
                      disabled={saving}
                      style={{
                        flex: 1, 
                        padding: '9px 0', 
                        borderRadius: 10, 
                        background: 'linear-gradient(135deg,#059669,#10b981)', 
                        border: 'none', 
                        color: 'white', 
                        fontSize: 13, 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        opacity: saving ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => !saving && (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={e => !saving && (e.currentTarget.style.opacity = '1')}
                    >
                      {saving ? '⏳' : '✅'} Mark Resolved
                    </button>
                  </div>

                  {selected.alertType === 'DANGEROUS_WEBSITE' && !selected.websiteBlocked && (
                    <button 
                      onClick={() => setBlockModal(selected)}
                      style={{
                        width: '100%', 
                        padding: '9px 0', 
                        borderRadius: 10, 
                        background: 'rgba(239,68,68,0.15)', 
                        border: '1px solid rgba(239,68,68,0.3)', 
                        color: '#f87171', 
                        fontSize: 13, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    >
                      <Globe style={{ width: 14, height: 14 }} /> Block Website
                    </button>
                  )}

                  {!selected.warningNotificationSent && (
                    <button 
                      onClick={() => setWarningModal(selected)}
                      style={{
                        width: '100%', 
                        padding: '9px 0', 
                        borderRadius: 10, 
                        background: 'rgba(168,85,247,0.15)', 
                        border: '1px solid rgba(168,85,247,0.3)', 
                        color: '#d8b4fe', 
                        fontSize: 13, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
                    >
                      <Send style={{ width: 14, height: 14 }} /> Send Warning
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Website Modal */}
      {blockModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={e => { if (e.target === e.currentTarget) setBlockModal(null) }}
        >
          <div style={{
            background: 'rgba(8,18,45,0.98)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe style={{ width: 20, height: 20, color: '#f87171' }} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>Block Website</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 16 }}>
              Block <strong>{blockModal.websiteDomain}</strong> for {getChildName(blockModal)}?
            </p>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
              This website will be restricted from being accessed. The child won't be able to visit this domain.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setBlockModal(null)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleBlockWebsite(blockModal)}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                  border: 'none',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? '⏳' : '🚫'} Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={e => { if (e.target === e.currentTarget) setWarningModal(null) }}
        >
          <div style={{
            background: 'rgba(8,18,45,0.98)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 450,
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send style={{ width: 20, height: 20, color: '#d8b4fe' }} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>Send Warning Notification</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 12 }}>
              Send a warning message to <strong>{getChildName(warningModal)}</strong>
            </p>
            <textarea 
              value={warningMessage}
              onChange={e => setWarningMessage(e.target.value)}
              placeholder="Enter your warning message (e.g., 'Please avoid visiting inappropriate websites')"
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(168,85,247,0.3)',
                color: 'white',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: 16,
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setWarningModal(null)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSendWarning(warningModal._id || warningModal.id)}
                disabled={saving || !warningMessage.trim()}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                  border: 'none',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: saving || !warningMessage.trim() ? 0.5 : 1
                }}
              >
                {saving ? '⏳' : '📨'} Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
