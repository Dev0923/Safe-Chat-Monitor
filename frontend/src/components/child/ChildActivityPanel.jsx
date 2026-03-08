02import React, { useState, useEffect } from 'react'
import { Activity, CheckCircle, AlertTriangle, Shield, Search } from 'lucide-react'
import { messageAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import { riskConfig, formatTime } from './shared'

const iconMap = { CheckCircle, AlertTriangle, Shield }

export default function ChildActivityPanel() {
  const { user } = useAuthStore()
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('ALL')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    if (!user?.childId) { setLoading(false); return }
    messageAPI.getChildMessages(user.childId)
      .then(res => {
        const msgs = Array.isArray(res.data) ? res.data : res.data?.messages || []
        setMessages(msgs)
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [user])

  const filters = ['ALL', 'SAFE', 'MEDIUM', 'HIGH']

  const filtered = messages.filter(m => {
    const level = m.riskLevel || 'SAFE'
    const matchFilter = filter === 'ALL' || level === filter
    const q = search.toLowerCase()
    const matchSearch = !q || (m.content || m.text || m.message || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const stats = {
    total:  messages.length,
    safe:   messages.filter(m => !m.riskLevel || m.riskLevel === 'SAFE').length,
    medium: messages.filter(m => m.riskLevel === 'MEDIUM').length,
    high:   messages.filter(m => m.riskLevel === 'HIGH').length,
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-xl">Activity Logs</h2>
        <p className="text-gray-500 text-sm mt-1">A record of all the messages you have tested</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total',     value: stats.total,  color:'text-blue-400',    border:'border-blue-500/20',    bg:'bg-blue-500/8'    },
          { label:'Safe',      value: stats.safe,   color:'text-emerald-400', border:'border-emerald-500/20', bg:'bg-emerald-500/8' },
          { label:'Medium',    value: stats.medium, color:'text-amber-400',   border:'border-amber-500/20',   bg:'bg-amber-500/8'   },
          { label:'High Risk', value: stats.high,   color:'text-red-400',     border:'border-red-500/20',     bg:'bg-red-500/8'     },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.border} ${s.bg}`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)' }}>
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none" />
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'text-gray-400 border-white/10 hover:text-white bg-white/3'
              }`}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(17,25,40,0.85)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)' }}>
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3"
          style={{ background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="col-span-6 text-gray-500 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Message
          </div>
          <div className="col-span-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Time</div>
          <div className="col-span-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Status</div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading your activity...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No activity yet</p>
            <p className="text-gray-500 text-sm">
              {search ? 'No messages match your search.' : 'Go to Safe Chat to start testing messages!'}
            </p>
          </div>
        ) : (
          filtered.map((msg, idx) => {
            const level = msg.riskLevel || 'SAFE'
            const cfg   = riskConfig[level] || riskConfig.SAFE
            const Ico   = iconMap[cfg.icon]
            const text  = msg.content || msg.text || msg.message || 'Message content unavailable'
            return (
              <div key={msg.id || msg._id || idx}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-white/3 transition-colors"
                style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="col-span-6 flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.border} ${cfg.bg}`}>
                    <Ico className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                  </div>
                  <span className="text-gray-300 text-sm truncate">{text}</span>
                </div>
                <div className="col-span-3 text-gray-500 text-xs">{formatTime(msg.createdAt || msg.timestamp || new Date())}</div>
                <div className="col-span-3 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className={`text-xs font-semibold ${cfg.iconColor}`}>{cfg.label}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
