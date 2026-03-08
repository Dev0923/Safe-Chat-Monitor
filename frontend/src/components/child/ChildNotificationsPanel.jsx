import React, { useState, useEffect } from 'react'
import { Bell, CheckCheck, AlertTriangle, CheckCircle, Clock, Mail, RefreshCw, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { gmailAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const riskBadge = {
  HIGH:   { label: 'Scam',       color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',     dot: 'bg-red-400'     },
  MEDIUM: { label: 'Suspicious', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   dot: 'bg-amber-400'   },
  LOW:    { label: 'Safe',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  SAFE:   { label: 'Safe',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
}

export default function ChildNotificationsPanel() {
  const { user } = useAuthStore()
  const [emails,   setEmails]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [syncing,  setSyncing]  = useState(false)
  const [readSet,  setReadSet]  = useState(new Set())
  const [expanded, setExpanded] = useState(null)

  const childId = user?.childId

  const fetchEmails = () => {
    if (!childId) { setLoading(false); return }
    setLoading(true)
    gmailAPI.getChildEmails(childId)
      .then(res => setEmails(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEmails() }, [childId])

  const syncNow = async () => {
    if (!childId) return
    setSyncing(true)
    try {
      await gmailAPI.sync(childId)
      // Wait a moment for backend to process, then refresh
      setTimeout(fetchEmails, 2000)
    } catch (e) {
      // ignore
    } finally {
      setSyncing(false)
    }
  }

  const markRead   = (id) => setReadSet(prev => new Set([...prev, id]))
  const markAll    = () => setReadSet(new Set(emails.map(e => e._id)))
  const toggleOpen = (id) => { markRead(id); setExpanded(prev => prev === id ? null : id) }

  const unread = emails.filter(e => !readSet.has(e._id))

  /* ─── No childId ─── */
  if (!childId) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-white font-bold text-xl">Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">Your email safety inbox</p>
        </div>
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(17,25,40,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Mail className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Gmail not linked yet</p>
          <p className="text-gray-500 text-sm">Go to Settings → Connected Accounts to connect your Gmail</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Loading...' : unread.length > 0 ? `${unread.length} unread` : 'Your scanned inbox'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button onClick={markAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-blue-400 text-sm font-semibold border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/15 transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button onClick={syncNow} disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 text-sm border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Emails', value: emails.length,                                                         color: 'text-blue-400',    border: 'border-blue-500/20',    bg: 'bg-blue-500/8'    },
          { label: 'Scam / Risk',  value: emails.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'MEDIUM').length, color: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/8'     },
          { label: 'Safe',         value: emails.filter(e => !e.riskLevel || e.riskLevel === 'LOW' || e.riskLevel === 'SAFE').length, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/8' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.border} ${s.bg}`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Safety tip */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,58,95,0.5))', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-gray-400 text-xs leading-relaxed">
          <span className="text-white font-semibold">AI-Scanned Inbox: </span>
          Every email below has been checked by AI. Red = scam, yellow = suspicious, green = safe.
          Never click links in scam emails!
        </p>
      </div>

      {/* Email list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading emails…</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: 'rgba(17,25,40,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Mail className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No emails scanned yet</p>
            <p className="text-gray-500 text-sm">Click <strong>Sync</strong> to scan your Gmail inbox now</p>
          </div>
        ) : (
          emails.map((email) => {
            const risk    = riskBadge[email.riskLevel] || riskBadge.SAFE
            const id      = email._id
            const isRead  = readSet.has(id)
            const isOpen  = expanded === id
            const subject = email.metadata?.subject || '(No Subject)'
            const from    = email.metadata?.sender  || email.metadata?.from || '(Unknown Sender)'

            return (
              <div key={id}
                className={`rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${isRead ? 'opacity-65' : ''} ${risk.border} ${risk.bg}`}
                onClick={() => toggleOpen(id)}>

                {/* Main row */}
                <div className="flex items-start gap-3 p-4">
                  {/* Gmail logo */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 mt-0.5">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Risk badge + unread dot + time */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${risk.bg} ${risk.color} ${risk.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} ${email.riskLevel === 'HIGH' ? 'animate-pulse' : ''}`} />
                          {risk.label}
                        </span>
                        {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeAgo(email.createdAt)}
                        {isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </div>
                    </div>
                    {/* Subject */}
                    <p className="text-white text-sm font-semibold leading-snug">{subject}</p>
                    {/* From */}
                    <p className="text-gray-500 text-xs mt-0.5 truncate">From: {from}</p>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5">
                    {email.aiAnalysisExplanation && (
                      <div className={`rounded-xl p-3 mt-3 border ${risk.border} ${risk.bg}`}>
                        <p className={`text-xs font-semibold ${risk.color} mb-1 flex items-center gap-1`}>
                          {email.riskLevel === 'HIGH' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          AI Verdict
                        </p>
                        <p className="text-gray-300 text-xs leading-relaxed">{email.aiAnalysisExplanation}</p>
                      </div>
                    )}
                    {email.content && (
                      <div className="rounded-xl p-3 bg-white/5 border border-white/7">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Email Preview</p>
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-6 whitespace-pre-wrap">{email.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

