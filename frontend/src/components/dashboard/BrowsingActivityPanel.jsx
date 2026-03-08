import React, { useState, useEffect } from 'react'
import { Globe, ChevronDown, Search, ExternalLink, Calendar, Filter, Flag } from 'lucide-react'
import { childAPI, activityAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'

const card = { background:'rgba(10,20,50,0.7)', border:'1px solid rgba(59,130,246,0.15)', backdropFilter:'blur(12px)', borderRadius:16, padding:20 }

const RiskBadge = ({ level }) => {
  const cfg = {
    HIGH:   { bg:'rgba(127,29,29,0.75)',  color:'#fca5a5', text:'High' },
    MEDIUM: { bg:'rgba(120,53,15,0.75)',  color:'#fcd34d', text:'Medium' },
    LOW:    { bg:'rgba(20,83,45,0.75)',   color:'#86efac', text:'Low' },
    SAFE:   { bg:'rgba(20,83,45,0.75)',   color:'#86efac', text:'Safe' },
  }
  const c = cfg[level] || cfg.SAFE
  return <span style={{ background:c.bg, color:c.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, whiteSpace:'nowrap' }}>{c.text}</span>
}

export default function BrowsingActivityPanel() {
  const { user } = useAuthStore()
  const [children,  setChildren]  = useState([])
  const [selected,  setSelected]  = useState(null)
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [childLoad, setChildLoad] = useState(true)
  const [search,     setSearch]     = useState('')
  const [days, setDays] = useState(7)

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
    if (!selected) return
    const id = selected._id || selected.id
    setLoading(true)
    
    Promise.all([
      activityAPI.getChildActivities(id, { limit: 100 }),
      activityAPI.getActivityStats(id, days)
    ])
      .then(([actRes, statsRes]) => {
        const acts = actRes.data?.activities || []
        setActivities(acts)
        setStats(statsRes.data?.data || null)
      })
      .catch(err => {
        console.error('Error fetching activities:', err)
        setActivities([])
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [selected, days])

  const filtered = activities.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || 
      (a.url||'').toLowerCase().includes(q) || 
      (a.title||'').toLowerCase().includes(q) ||
      (a.domain||'').toLowerCase().includes(q)
    return matchSearch
  })

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const truncateUrl = (url, maxLen = 50) => {
    if (url.length <= maxLen) return url
    return url.substring(0, maxLen) + '...'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <h2 style={{ color:'white', fontWeight:700, fontSize:20, margin:0 }}>Browsing Activity</h2>
        <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Monitor websites visited by your children via browser extension</p>
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
              <select value={selected?._id||selected?.id||''} onChange={e => setSelected(children.find(c => (c._id||c.id) === e.target.value))}
                style={{ padding:'7px 32px 7px 12px', borderRadius:9, background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.25)', color:'white', fontSize:13, fontWeight:600, outline:'none', cursor:'pointer', appearance:'none' }}>
                {children.map(c => <option key={c._id||c.id} value={c._id||c.id}>{c.name}</option>)}
              </select>
              <ChevronDown style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'#60a5fa', pointerEvents:'none' }} />
            </div>
          )}
        </div>

        {/* Days filter */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'#475569', fontSize:12, fontWeight:600 }}>Period:</span>
          <div style={{ display:'flex', gap:4 }}>
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s',
                  background: days===d ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.05)',
                  color: days===d ? 'white' : '#64748b',
                  boxShadow: days===d ? '0 2px 10px rgba(59,130,246,0.3)' : 'none',
                }}>
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ flex:1, minWidth:150, position:'relative' }}>
          <Search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search websites..."
            style={{ width:'100%', padding:'7px 12px 7px 30px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(59,130,246,0.15)', color:'white', fontSize:12, outline:'none', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Stats row */}
      {selected && stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'Total Visits',    value:stats.totalActivities,  color:'#60a5fa', icon: Globe },
            { label:'Unique Sites',    value:stats.uniqueDomains,    color:'#34d399', icon: ExternalLink },
            { label:'Flagged',         value:stats.flaggedCount,     color:'#f87171', icon: Flag },
            { label:'Days Tracked',    value:stats.days,             color:'#fbbf24', icon: Calendar },
          ].map((s,i) => (
            <div key={i} style={{ ...card, padding:14, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <s.icon style={{ width:16, height:16, color:s.color }} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ color:'#64748b', fontSize:11, margin:'0 0 2px' }}>{s.label}</p>
                <p style={{ color:s.color, fontSize:20, fontWeight:900, margin:0 }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top domains */}
      {selected && stats && stats.topDomains && stats.topDomains.length > 0 && (
        <div style={card}>
          <h3 style={{ color:'white', fontSize:14, fontWeight:700, margin:'0 0 12px' }}>Top Websites</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {stats.topDomains.slice(0, 8).map((d, i) => (
              <div key={i} style={{ 
                padding:'8px 14px', 
                borderRadius:10, 
                background:'rgba(59,130,246,0.1)', 
                border:'1px solid rgba(59,130,246,0.2)',
                display:'flex',
                alignItems:'center',
                gap:8
              }}>
                <span style={{ color:'#93c5fd', fontSize:12, fontWeight:600 }}>{d.domain}</span>
                <span style={{ color:'#60a5fa', fontSize:11, fontWeight:700, background:'rgba(59,130,246,0.2)', padding:'2px 6px', borderRadius:5 }}>
                  {d.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity table */}
      <div style={card}>
        {/* Table head */}
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 2.5fr 1fr 0.7fr', gap:12, paddingBottom:10, marginBottom:6, borderBottom:'1px solid rgba(59,130,246,0.1)' }}>
          {['Time','Website','Page Title','Status'].map(h => (
            <span key={h} style={{ color:'#475569', fontSize:11, fontWeight:700 }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : !selected ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <Globe style={{ width:40, height:40, color:'#1e3a5f', display:'block', margin:'0 auto 12px' }} />
            <p style={{ color:'#64748b', fontSize:14, margin:0 }}>Select a child to view browsing activity</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <Globe style={{ width:40, height:40, color:'#1e3a5f', display:'block', margin:'0 auto 12px' }} />
            <p style={{ color:'#64748b', fontSize:14, margin:0 }}>
              {activities.length === 0 
                ? 'No browsing activity recorded yet. Make sure the extension is installed.' 
                : 'No activities match your search'}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight:500, overflowY:'auto' }}>
            {filtered.map((activity, i) => (
              <div key={activity._id || i} style={{ 
                display:'grid', 
                gridTemplateColumns:'1.2fr 2.5fr 1fr 0.7fr', 
                gap:12, 
                padding:'10px 0', 
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                alignItems:'center'
              }}>
                <span style={{ color:'#93c5fd', fontSize:12 }}>
                  {formatTime(activity.timestamp)}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <ExternalLink style={{ width:12, height:12, color:'#60a5fa', flexShrink:0 }} />
                  <a href={activity.url} target="_blank" rel="noopener noreferrer"
                    style={{ color:'#60a5fa', fontSize:12, textDecoration:'none', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                    title={activity.url}>
                    {activity.domain || truncateUrl(activity.url)}
                  </a>
                </div>
                <span style={{ color:'#cbd5e1', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={activity.title}>
                  {activity.title || '(No title)'}
                </span>
                <RiskBadge level={activity.riskLevel || 'SAFE'} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note about extension */}
      {selected && activities.length === 0 && !loading && (
        <div style={{ ...card, padding:16, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)' }}>
          <div style={{ display:'flex', gap:12, alignItems:'start' }}>
            <Globe style={{ width:20, height:20, color:'#60a5fa', flexShrink:0, marginTop:2 }} />
            <div>
              <p style={{ color:'#93c5fd', fontSize:13, fontWeight:600, margin:'0 0 4px' }}>Extension Required</p>
              <p style={{ color:'#64748b', fontSize:12, margin:0, lineHeight:1.5 }}>
                To track browsing activity, your child needs to install the Safety Monitor browser extension and configure it with their Child ID.
                The extension will automatically report visited websites to this dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
