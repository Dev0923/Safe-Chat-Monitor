import React, { useState, useEffect } from 'react'
import { Users, Plus, Eye, Trash2, X, Shield, Activity, Clock, CheckCircle, LogIn } from 'lucide-react'
import { childAPI, messageAPI } from '../../services/api'

const card = { background:'rgba(10,20,50,0.7)', border:'1px solid rgba(59,130,246,0.15)', backdropFilter:'blur(12px)', borderRadius:16, padding:20 }

const RiskBadge = ({ level }) => {
  const cfg = {
    HIGH:   { bg:'rgba(127,29,29,0.75)',  color:'#fca5a5', text:'High' },
    MEDIUM: { bg:'rgba(120,53,15,0.75)',  color:'#fcd34d', text:'Medium' },
    LOW:    { bg:'rgba(20,83,45,0.75)',   color:'#86efac', text:'Low' },
    SAFE:   { bg:'rgba(20,83,45,0.75)',   color:'#86efac', text:'Safe' },
  }
  const c = cfg[level] || cfg.LOW
  return <span style={{ background:c.bg, color:c.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6 }}>{c.text}</span>
}

export default function ChildrenPanel({ children: propChildren, onChildrenChange }) {
  const [children, setChildren]     = useState(propChildren || [])
  const [loading, setLoading]       = useState(false)

  // Add-child modal
  const [showLink, setShowLink]     = useState(false)
  const [linkEmail, setLinkEmail]   = useState('')
  const [linkPass,  setLinkPass]    = useState('')
  const [linkAge,   setLinkAge]     = useState(12)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError,   setLinkError]   = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')

  // Activity modal
  const [activityChild,    setActivityChild]    = useState(null)
  const [activityMessages, setActivityMessages] = useState([])
  const [activityLoading,  setActivityLoading]  = useState(false)

  // Remove modal
  const [removeChild,   setRemoveChild]   = useState(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  // Update local state when prop changes
  useEffect(() => {
    if (propChildren) {
      setChildren(propChildren)
    }
  }, [propChildren])

  const handleLink = async () => {
    if(!linkEmail||!linkPass) { setLinkError('Email and password are required'); return }
    setLinkLoading(true); setLinkError(''); setLinkSuccess('')
    try {
      await childAPI.linkChild(linkEmail, linkPass, linkAge)
      setLinkSuccess('Child linked successfully!')
      // Refresh parent's children data
      if (onChildrenChange) {
        await onChildrenChange()
      }
      setTimeout(() => { setShowLink(false); setLinkEmail(''); setLinkPass(''); setLinkAge(12); setLinkSuccess('') }, 1500)
    } catch(e) {
      setLinkError(e?.response?.data?.message || 'Failed to link child')
    } finally { setLinkLoading(false) }
  }

  const handleViewActivity = async (child) => {
    setActivityChild(child); setActivityLoading(true); setActivityMessages([])
    try {
      const res = await messageAPI.getChildMessages(child._id || child.id)
      setActivityMessages(Array.isArray(res.data) ? res.data : res.data?.messages || [])
    } catch(e) { console.error(e) }
    finally { setActivityLoading(false) }
  }

  const handleRemove = async () => {
    if(!removeChild) return
    setRemoveLoading(true)
    try {
      await childAPI.removeChild(removeChild._id || removeChild.id)
      // Refresh parent's children data
      if (onChildrenChange) {
        await onChildrenChange()
      }
      setRemoveChild(null)
    } catch(e) { console.error(e) }
    finally { setRemoveLoading(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ color:'white', fontWeight:700, fontSize:20, margin:0 }}>Manage Children</h2>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>View, add or remove monitored children</p>
        </div>
        <button onClick={() => { setShowLink(true); setLinkError(''); setLinkSuccess('') }}
          style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', padding:'9px 18px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:'0 4px 15px rgba(59,130,246,0.35)' }}>
          <Plus style={{width:15,height:15}}/> Add Child
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Total Children', value:children.length, color:'#60a5fa' },
          { label:'High Risk Alerts', value:children.reduce((a,c) => a+(c.totalHighRiskAlerts||0),0), color:'#f87171' },
          { label:'Medium Risk Alerts', value:children.reduce((a,c) => a+(c.totalMediumRiskAlerts||0),0), color:'#fbbf24' },
        ].map((s,i) => (
          <div key={i} style={{ ...card, padding:16 }}>
            <p style={{ color:'#64748b', fontSize:11, margin:'0 0 6px' }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:28, fontWeight:900, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Children Grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:50 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : children.length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:'50px 20px' }}>
          <Users style={{ width:48, height:48, color:'#1e3a5f', margin:'0 auto 14px', display:'block' }} />
          <p style={{ color:'white', fontWeight:600, fontSize:15, margin:0 }}>No children linked yet</p>
          <p style={{ color:'#475569', fontSize:13, marginTop:6 }}>Click "Add Child" to link a child profile.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {children.map((child, i) => (
            <div key={child._id||i} style={{ ...card, padding:0, overflow:'hidden' }}>
              {/* Top accent */}
              <div style={{ height:4, background:'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)' }} />
              <div style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'white' }}>
                    {(child.name||'?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color:'white', fontWeight:700, fontSize:15, margin:0 }}>{child.name||'Unnamed'}</p>
                    <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>Age group: {child.ageGroup||'—'}</p>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                  <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, padding:'8px 10px' }}>
                    <p style={{ color:'#f87171', fontSize:11, margin:'0 0 2px', fontWeight:600 }}>High Risk</p>
                    <p style={{ color:'white', fontSize:18, fontWeight:900, margin:0 }}>{child.totalHighRiskAlerts||0}</p>
                  </div>
                  <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:8, padding:'8px 10px' }}>
                    <p style={{ color:'#fbbf24', fontSize:11, margin:'0 0 2px', fontWeight:600 }}>Med Risk</p>
                    <p style={{ color:'white', fontSize:18, fontWeight:900, margin:0 }}>{child.totalMediumRiskAlerts||0}</p>
                  </div>
                </div>

                {child.lastActivityTime && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: child.lastLoginTime ? 6 : 14 }}>
                    <Clock style={{ width:12, height:12, color:'#475569' }} />
                    <span style={{ color:'#64748b', fontSize:12 }}>Last active: {new Date(child.lastActivityTime).toLocaleString()}</span>
                  </div>
                )}
                {child.lastLoginTime && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                    <LogIn style={{ width:12, height:12, color:'#3b82f6' }} />
                    <span style={{ color:'#60a5fa', fontSize:12 }}>Last login: {new Date(child.lastLoginTime).toLocaleString()}</span>
                  </div>
                )}
                {!child.lastActivityTime && !child.lastLoginTime && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                    <Clock style={{ width:12, height:12, color:'#475569' }} />
                    <span style={{ color:'#64748b', fontSize:12 }}>No activity yet</span>
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={() => handleViewActivity(child)}
                    style={{ padding:'8px 0', borderRadius:8, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <Eye style={{width:13,height:13}}/> Activity
                  </button>
                  <button onClick={() => setRemoveChild(child)}
                    style={{ padding:'8px 0', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <Trash2 style={{width:13,height:13}}/> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Child Modal ── */}
      {showLink && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
          onClick={e => { if(e.target===e.currentTarget){ setShowLink(false); setLinkError(''); setLinkSuccess('') }}}>
          <div style={{ background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:20, padding:28, width:'100%', maxWidth:420, boxShadow:'0 25px 60px rgba(0,0,0,0.6)', position:'relative' }}>
            <button onClick={() => setShowLink(false)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.05)', border:'none', color:'#94a3b8', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X style={{width:16,height:16}} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Users style={{ width:22, height:22, color:'white' }} />
              </div>
              <div>
                <h2 style={{ color:'white', fontWeight:700, fontSize:16, margin:0 }}>Link Child Account</h2>
                <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>Enter your child's login credentials</p>
              </div>
            </div>
            {[
              { label:'Child Email', value:linkEmail, setter:setLinkEmail, type:'email', placeholder:'child@example.com' },
              { label:'Child Password', value:linkPass, setter:setLinkPass, type:'password', placeholder:'••••••••' },
            ].map(({ label, value, setter, type, placeholder }) => (
              <div key={label} style={{ marginBottom:14 }}>
                <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>{label}</label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(59,130,246,0.2)', color:'white', fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:18 }}>
              <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>Age Group</label>
              <select value={linkAge} onChange={e => setLinkAge(parseInt(e.target.value))}
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.2)', color:'white', fontSize:13, outline:'none', boxSizing:'border-box' }}>
                <option value={12}>Child (under 13)</option>
                <option value={15}>Teen (13-17)</option>
                <option value={18}>Young Adult (18+)</option>
              </select>
            </div>
            {linkError   && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:12, padding:'8px 12px', borderRadius:8, marginBottom:12 }}>{linkError}</div>}
            {linkSuccess && <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', color:'#34d399', fontSize:12, padding:'8px 12px', borderRadius:8, marginBottom:12 }}>{linkSuccess}</div>}
            <button onClick={handleLink} disabled={linkLoading}
              style={{ width:'100%', padding:'11px 0', borderRadius:12, background:`linear-gradient(135deg,#1d4ed8,#3b82f6)`, border:'none', color:'white', fontSize:14, fontWeight:700, cursor: linkLoading?'not-allowed':'pointer', opacity:linkLoading?0.7:1 }}>
              {linkLoading ? 'Linking…' : 'Link Child'}
            </button>
          </div>
        </div>
      )}

      {/* ── Activity Modal ── */}
      {activityChild && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
          onClick={e => { if(e.target===e.currentTarget) setActivityChild(null) }}>
          <div style={{ background:'rgba(8,18,45,0.98)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:20, padding:28, width:'100%', maxWidth:600, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 25px 60px rgba(0,0,0,0.6)', position:'relative' }}>
            <button onClick={() => setActivityChild(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.05)', border:'none', color:'#94a3b8', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X style={{width:16,height:16}} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'white' }}>
                {(activityChild.name||'?')[0]?.toUpperCase()}
              </div>
              <div>
                <h2 style={{ color:'white', fontWeight:700, fontSize:16, margin:0 }}>{activityChild.name}'s Activity</h2>
                <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>{activityMessages.length} messages</p>
                {activityChild.lastLoginTime && (
                  <p style={{ color:'#60a5fa', fontSize:12, margin:'4px 0 0', display:'flex', alignItems:'center', gap:5 }}>
                    <LogIn style={{ width:12, height:12, display:'inline', flexShrink:0 }} />
                    Last login: {new Date(activityChild.lastLoginTime).toLocaleString()}
                  </p>
                )}
                {!activityChild.lastLoginTime && (
                  <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>Never logged in</p>
                )}
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
              {activityLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:30 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
                </div>
              ) : activityMessages.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 0' }}>
                  <Activity style={{ width:36, height:36, color:'#1e3a5f', margin:'0 auto 10px', display:'block' }} />
                  <p style={{ color:'#94a3b8', fontSize:14, margin:0 }}>No messages yet</p>
                </div>
              ) : (
                activityMessages.map((m, i) => (
                  <div key={m._id||i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(59,130,246,0.1)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ color:'#e2e8f0', fontSize:13, margin:'0 0 5px', lineHeight:1.4 }}>{m.content||m.text||'—'}</p>
                      <span style={{ color:'#475569', fontSize:11 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                    </div>
                    <RiskBadge level={m.riskLevel||'SAFE'} />
                  </div>
                ))
              )}
            </div>
            {!activityLoading && activityMessages.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14, paddingTop:14, borderTop:'1px solid rgba(59,130,246,0.1)' }}>
                {[
                  { label:'Total', value:activityMessages.length, color:'#60a5fa' },
                  { label:'High Risk', value:activityMessages.filter(m=>m.riskLevel==='HIGH').length, color:'#f87171' },
                  { label:'Safe', value:activityMessages.filter(m=>!m.riskLevel||m.riskLevel==='SAFE'||m.riskLevel==='LOW').length, color:'#34d399' },
                ].map((s,i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                    <p style={{ color:s.color, fontSize:20, fontWeight:900, margin:'0 0 2px' }}>{s.value}</p>
                    <p style={{ color:'#64748b', fontSize:11, margin:0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Remove Modal ── */}
      {removeChild && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
          onClick={e => { if(e.target===e.currentTarget) setRemoveChild(null) }}>
          <div style={{ background:'rgba(8,18,45,0.98)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 25px 60px rgba(0,0,0,0.6)', position:'relative' }}>
            <button onClick={() => setRemoveChild(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.05)', border:'none', color:'#94a3b8', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X style={{width:16,height:16}} />
            </button>
            <Trash2 style={{ width:44, height:44, color:'#f87171', margin:'0 auto 16px', display:'block' }} />
            <h2 style={{ color:'white', fontWeight:700, fontSize:16, textAlign:'center', margin:'0 0 8px' }}>Remove Child?</h2>
            <p style={{ color:'#94a3b8', fontSize:13, textAlign:'center', margin:'0 0 20px' }}>
              Remove <strong style={{ color:'white' }}>{removeChild.name}</strong> from your monitoring list? This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setRemoveChild(null)}
                style={{ flex:1, padding:'10px 0', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleRemove} disabled={removeLoading}
                style={{ flex:1, padding:'10px 0', borderRadius:10, background:'linear-gradient(135deg,#b91c1c,#ef4444)', border:'none', color:'white', fontSize:13, fontWeight:700, cursor: removeLoading?'not-allowed':'pointer', opacity:removeLoading?0.7:1 }}>
                {removeLoading ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
