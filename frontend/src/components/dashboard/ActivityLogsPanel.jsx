import React, { useState, useEffect } from 'react'
import { Activity, ChevronDown, Filter, Search, Globe, Clock, AlertTriangle } from 'lucide-react'
import { childAPI, activityLogAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'

const card = { background:'rgba(10,20,50,0.7)', border:'1px solid rgba(59,130,246,0.15)', backdropFilter:'blur(12px)', borderRadius:16, padding:20 }

const RiskBadge = ({ level }) => {
  const cfg = {
    Dangerous: { bg:'rgba(127,29,29,0.75)',  color:'#fca5a5', text:'Dangerous' },
    Warning:   { bg:'rgba(120,53,15,0.75)',  color:'#fcd34d', text:'Warning' },
    Safe:      { bg:'rgba(20,83,45,0.75)',   color:'#86efac', text:'Safe' },
  }
  const c = cfg[level] || cfg.Safe
  return <span style={{ background:c.bg, color:c.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, whiteSpace:'nowrap' }}>{c.text}</span>
}

const CategoryBadge = ({ category }) => {
  const cfg = {
    Education:     { bg:'rgba(59,130,246,0.15)', color:'#60a5fa' },
    Entertainment: { bg:'rgba(168,85,247,0.15)', color:'#c084fc' },
    Social:        { bg:'rgba(236,72,153,0.15)', color:'#f472b6' },
    Gaming:        { bg:'rgba(34,197,94,0.15)',  color:'#4ade80' },
    News:          { bg:'rgba(251,146,60,0.15)', color:'#fb923c' },
    Shopping:      { bg:'rgba(234,179,8,0.15)',  color:'#facc15' },
    Unknown:       { bg:'rgba(100,116,139,0.15)', color:'#94a3b8' },
  }
  const c = cfg[category] || cfg.Unknown
  return <span style={{ background:c.bg, color:c.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:6, whiteSpace:'nowrap' }}>{category}</span>
}

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function ActivityLogsPanel() {
  const { user } = useAuthStore()
  const [children,  setChildren]  = useState([])
  const [selected,  setSelected]  = useState(null)
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [childLoad, setChildLoad] = useState(true)
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    childAPI.getParentChildren()
      .then(res => {
        const kids = Array.isArray(res.data) ? res.data : res.data?.children || []
        setChildren(kids)
        if (kids.length > 0) setSelected(kids[0])
      })
      .catch(console.error)
      .finally(() => setChildLoad(false))
  }, [])

  useEffect(() => {
    const parentId = user?.id || user?.userId
    if (!parentId) return
    
    setLoading(true); setLogs([])
    
    const options = { limit: 100 }
    if (selected) options.childId = selected._id || selected.id
    
    activityLogAPI.getActivityLogs(parentId, options)
      .then(res => {
        const activityLogs = Array.isArray(res.data.data) ? res.data.data : [];
        setLogs(activityLogs);
      })
      .catch(err => {
        console.error('Error fetching activity logs:', err)
        setLogs([])
      })
      .finally(() => setLoading(false))
  }, [user, selected])

  const filtered = logs.filter(log => {
    const matchRisk = riskFilter === 'ALL' || log.riskLevel === riskFilter
    const matchCategory = categoryFilter === 'ALL' || log.category === categoryFilter
    const q = search.toLowerCase()
    const matchSearch = !q || 
      (log.domain || '').toLowerCase().includes(q) ||
      (log.title || '').toLowerCase().includes(q) ||
      (log.url || '').toLowerCase().includes(q)
    return matchRisk && matchCategory && matchSearch
  })

  const stats = {
    total:     logs.length,
    dangerous: logs.filter(l => l.riskLevel === 'Dangerous').length,
    warning:   logs.filter(l => l.riskLevel === 'Warning').length,
    safe:      logs.filter(l => l.riskLevel === 'Safe').length,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <h2 style={{ color:'white', fontWeight:700, fontSize:20, margin:0 }}>Activity Logs</h2>
        <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Monitor your children's browsing activity and website visits</p>
      </div>

      {/* Child selector & filters */}
      <div style={{ ...card, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'#475569', fontSize:12, fontWeight:600 }}>Child:</span>
          {childLoad ? (
            <span style={{ color:'#64748b', fontSize:12 }}>Loading…</span>
          ) : children.length === 0 ? (
            <span style={{ color:'#64748b', fontSize:12 }}>No children linked</span>
          ) : (
            <div style={{ position:'relative' }}>
              <select value={selected?._id||selected?.id||''} onChange={e => {
                const child = children.find(c => (c._id||c.id) === e.target.value)
                setSelected(child || null)
              }}
                style={{ padding:'7px 32px 7px 12px', borderRadius:9, background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.25)', color:'white', fontSize:13, fontWeight:600, outline:'none', cursor:'pointer', appearance:'none' }}>
                <option value="">All Children</option>
                {children.map(c => <option key={c._id||c.id} value={c._id||c.id}>{c.name}</option>)}
              </select>
              <ChevronDown style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'#60a5fa', pointerEvents:'none' }} />
            </div>
          )}
        </div>

        {/* Risk filter */}
        <div style={{ display:'flex', gap:6 }}>
          {['ALL','Dangerous','Warning','Safe'].map(f => (
            <button key={f} onClick={() => setRiskFilter(f)}
              style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s',
                background: riskFilter===f ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.05)',
                color: riskFilter===f ? 'white' : '#64748b',
                boxShadow: riskFilter===f ? '0 2px 10px rgba(59,130,246,0.3)' : 'none',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:6 }}>
          {['ALL','Education','Social','Entertainment','Gaming'].map(f => (
            <button key={f} onClick={() => setCategoryFilter(f)}
              style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s',
                background: categoryFilter===f ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.05)',
                color: categoryFilter===f ? 'white' : '#64748b',
                boxShadow: categoryFilter===f ? '0 2px 10px rgba(168,85,247,0.3)' : 'none',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex:1, minWidth:150, position:'relative' }}>
          <Search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search websites…"
            style={{ width:'100%', padding:'7px 12px 7px 30px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(59,130,246,0.15)', color:'white', fontSize:12, outline:'none', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'Total Sites',    value:stats.total,     color:'#60a5fa' },
          { label:'Dangerous',      value:stats.dangerous, color:'#f87171' },
          { label:'Warning',        value:stats.warning,   color:'#fbbf24' },
          { label:'Safe',           value:stats.safe,      color:'#34d399' },
        ].map((s,i) => (
          <div key={i} style={{ ...card, padding:14 }}>
            <p style={{ color:'#64748b', fontSize:11, margin:'0 0 4px' }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:22, fontWeight:900, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Activity logs table */}
      <div style={card}>
        {/* Table head */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1.2fr 0.8fr', gap:12, paddingBottom:10, marginBottom:6, borderBottom:'1px solid rgba(59,130,246,0.1)' }}>
          {['Website / Domain','Page Title','Category','Risk Level','Time Visited','Duration'].map(h => (
            <span key={h} style={{ color:'#475569', fontSize:11, fontWeight:700 }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <Globe style={{ width:40, height:40, color:'#1e3a5f', display:'block', margin:'0 auto 12px' }} />
            <p style={{ color:'white', fontWeight:600, fontSize:14, margin:0 }}>
              {logs.length === 0 ? 'No browsing activity yet' : 'No matching activity'}
            </p>
            <p style={{ color:'#475569', fontSize:12, marginTop:4 }}>
              {logs.length === 0 
                ? 'Activity will appear here once the extension starts tracking' 
                : 'Try adjusting the filters or search'}
            </p>
          </div>
        ) : (
          filtered.map((log, i) => (
            <div key={log._id||i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1.2fr 0.8fr', gap:12, alignItems:'center', padding:'10px 0', borderBottom: i < filtered.length-1 ? '1px solid rgba(59,130,246,0.06)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
                <Globe style={{ width:14, height:14, color:'#60a5fa', flexShrink:0 }} />
                <span style={{ color:'#e2e8f0', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {log.domain || 'unknown'}
                </span>
              </div>
              <span style={{ color:'#94a3b8', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={log.title}>
                {log.title || '—'}
              </span>
              <CategoryBadge category={log.category || 'Unknown'} />
              <RiskBadge level={log.riskLevel || 'Safe'} />
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Clock style={{ width:12, height:12, color:'#475569' }} />
                <span style={{ color:'#64748b', fontSize:12 }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString([],{dateStyle:'short',timeStyle:'short'}) : '—'}
                </span>
              </div>
              <span style={{ color:'#60a5fa', fontSize:12, fontWeight:600 }}>
                {log.duration > 0 ? formatDuration(log.duration) : '—'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
