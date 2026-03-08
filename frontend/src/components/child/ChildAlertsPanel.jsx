import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, Clock, Eye, X, Mail } from 'lucide-react'
import { alertAPI } from '../../services/api'
import { riskConfig, formatTime } from './shared'
import useAuthStore from '../../store/authStore'

const iconMap = { CheckCircle, AlertTriangle, Shield }

const tipsByLevel = {
  HIGH:   'This message has serious warning signs. Always talk to a trusted adult if you receive messages like this.',
  MEDIUM: 'Be cautious with this kind of message. Think before you respond and ask a parent if you\'re not sure.',
  SAFE:   'This message was safe. Keep practicing good online safety habits!',
  LOW:    'This message had minor concerns. Stay alert and trust your instincts.',
}

export default function ChildAlertsPanel() {
  const { user } = useAuthStore()
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => {
    const childId = user?.childId
    if (!childId) { setLoading(false); return }
    alertAPI.getChildAlerts(childId)
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : res.data?.alerts || res.data?.content || []
        setAlerts(items)
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [user?.childId])

  const filters = ['ALL', 'HIGH', 'MEDIUM', 'SAFE']
  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => (a.riskLevel || a.risk_level || 'SAFE') === filter)

  const stats = {
    total:  alerts.length,
    high:   alerts.filter(a => (a.riskLevel || a.risk_level) === 'HIGH').length,
    medium: alerts.filter(a => (a.riskLevel || a.risk_level) === 'MEDIUM').length,
    safe:   alerts.filter(a => !(a.riskLevel || a.risk_level) || (a.riskLevel || a.risk_level) === 'SAFE').length,
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-xl">My Alerts</h2>
        <p className="text-gray-500 text-sm mt-1">These are messages the AI flagged for review</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Checked', value: stats.total,  color:'text-blue-400',    border:'border-blue-500/20',    bg:'bg-blue-500/8'    },
          { label:'High Risk',     value: stats.high,   color:'text-red-400',     border:'border-red-500/20',     bg:'bg-red-500/8'     },
          { label:'Medium Risk',   value: stats.medium, color:'text-amber-400',   border:'border-amber-500/20',   bg:'bg-amber-500/8'   },
          { label:'Safe',          value: stats.safe,   color:'text-emerald-400', border:'border-emerald-500/20', bg:'bg-emerald-500/8' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.border} ${s.bg}`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Safety reminder */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background:'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,58,95,0.5))', border:'1px solid rgba(59,130,246,0.2)' }}>
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-0.5">Stay Safe Online!</p>
          <p className="text-gray-400 text-xs leading-relaxed">If any message makes you feel uncomfortable or scared, always tell a trusted adult — a parent, teacher, or guardian.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-500'
                : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20 bg-white/3'
            }`}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(17,25,40,0.85)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)' }}>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">All clear!</p>
            <p className="text-gray-500 text-sm">No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}alerts found.</p>
          </div>
        ) : (
          filtered.map((alert, idx) => {
            const level = alert.riskLevel || alert.risk_level || 'SAFE'
            const cfg   = riskConfig[level] || riskConfig.SAFE
            const Ico   = iconMap[cfg.icon]
            return (
              <div key={alert.id || alert._id || idx}
                className="flex items-start gap-4 px-5 py-4 hover:bg-white/3 transition-colors cursor-pointer"
                style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                onClick={() => setSelected(alert)}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${cfg.border} ${cfg.bg}`}>
                  <Ico className={`w-4 h-4 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Source badge */}
                  {alert.source === 'GMAIL' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-white/8 text-gray-400 border border-white/10 mb-1">
                      <Mail className="w-2.5 h-2.5" /> Email
                    </span>
                  )}
                  <p className="text-gray-200 text-sm font-medium truncate">
                    {alert.description || alert.content || alert.message || alert.text || 'Message content unavailable'}
                  </p>
                  {alert.source === 'GMAIL' && alert.metadata?.subject && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">Subject: {alert.metadata.subject}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatTime(alert.createdAt || alert.timestamp || new Date())}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-semibold ${cfg.iconColor}`}>{cfg.label}</span>
                  <Eye className="w-3.5 h-3.5 text-gray-600 ml-1" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background:'rgba(17,25,40,0.98)', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Alert Detail</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {(() => {
              const level = selected.riskLevel || selected.risk_level || 'SAFE'
              const cfg   = riskConfig[level] || riskConfig.SAFE
              const Ico   = iconMap[cfg.icon]
              return (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                    <Ico className={`w-5 h-5 ${cfg.iconColor}`} />
                    <span className={`font-bold text-sm ${cfg.iconColor}`}>Risk Level: {level}</span>
                  </div>
                  <div className="p-3.5 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-gray-400 text-xs mb-1">Message</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{selected.content || selected.message || selected.text || 'N/A'}</p>
                  </div>
                  {selected.explanation && (
                    <div className="p-3.5 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-gray-400 text-xs mb-1">AI Analysis</p>
                      <p className="text-gray-200 text-sm leading-relaxed">{selected.explanation}</p>
                    </div>
                  )}
                  <div className={`p-3.5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                    <p className={`text-xs font-semibold mb-1 ${cfg.iconColor}`}>What should you do?</p>
                    <p className="text-gray-300 text-xs leading-relaxed">{tipsByLevel[level] || tipsByLevel.SAFE}</p>
                  </div>
                  <div className="text-gray-600 text-xs">{formatTime(selected.createdAt || selected.timestamp || new Date())}</div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
