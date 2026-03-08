import React, { useState, useEffect } from 'react'
import { User, Lock, Bell, Moon, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { userAPI, authAPI } from '../../services/api'

const card = { background:'rgba(10,20,50,0.7)', border:'1px solid rgba(59,130,246,0.15)', backdropFilter:'blur(12px)', borderRadius:16, padding:24 }

const Toggle = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{
    width:44, height:24, borderRadius:12, cursor:'pointer', transition:'background 0.2s', position:'relative', flexShrink:0,
    background: checked ? 'linear-gradient(90deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.1)',
  }}>
    <div style={{
      position:'absolute', top:3, left: checked ? 23 : 3, width:18, height:18, borderRadius:'50%', background:'white',
      boxShadow: checked ? '0 2px 6px rgba(59,130,246,0.5)' : '0 2px 4px rgba(0,0,0,0.2)',
      transition:'all 0.2s',
    }}/>
  </div>
)

const Toast = ({ type, msg }) => (
  msg ? (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, marginBottom:14,
      background: type==='success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${type==='success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color: type==='success' ? '#34d399' : '#f87171', fontSize:13,
    }}>
      {type === 'success' ? <CheckCircle style={{width:15,height:15,flexShrink:0}}/> : <AlertCircle style={{width:15,height:15,flexShrink:0}}/>}
      {msg}
    </div>
  ) : null
)

export default function SettingsPanel() {
  // Profile
  const [profile,   setProfile]    = useState({ name:'', email:'' })
  const [profEdit,  setProfEdit]   = useState({ name:'', email:'' })
  const [profLoading, setProfLoad] = useState(false)
  const [profMsg,   setProfMsg]    = useState({ type:'', text:'' })

  // Password
  const [oldPwd,    setOldPwd]    = useState('')
  const [newPwd,    setNewPwd]    = useState('')
  const [confPwd,   setConfPwd]   = useState('')
  const [showOld,   setShowOld]   = useState(false)
  const [showNew,   setShowNew]   = useState(false)
  const [pwdLoad,   setPwdLoad]   = useState(false)
  const [pwdMsg,    setPwdMsg]    = useState({ type:'', text:'' })

  // Preferences
  const [emailAlert, setEmailAlert] = useState(false)
  const [darkMode,   setDarkMode]   = useState(false)
  const [prefLoad,   setPrefLoad]   = useState(false)

  useEffect(() => {
    userAPI.getProfile()
      .then(res => {
        const d = res.data?.user || res.data || {}
        setProfile({ name: d.name||'', email: d.email||'' })
        setProfEdit({ name: d.name||'', email: d.email||'' })
        setEmailAlert(!!d.emailAlerts)
        setDarkMode(!!d.darkMode)
      })
      .catch(console.error)
  }, [])

  const handleSaveProfile = async () => {
    setProfLoad(true); setProfMsg({ type:'', text:'' })
    try {
      await userAPI.updateProfile({ name: profEdit.name })
      setProfile(prev => ({ ...prev, name: profEdit.name }))
      setProfMsg({ type:'success', text:'Profile updated successfully!' })
    } catch(e) {
      setProfMsg({ type:'error', text: e?.response?.data?.message || 'Failed to update profile' })
    } finally { setProfLoad(false) }
  }

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd || !confPwd) { setPwdMsg({ type:'error', text:'All password fields are required' }); return }
    if (newPwd !== confPwd) { setPwdMsg({ type:'error', text:'New passwords do not match' }); return }
    if (newPwd.length < 6) { setPwdMsg({ type:'error', text:'Password must be at least 6 characters' }); return }
    setPwdLoad(true); setPwdMsg({ type:'', text:'' })
    try {
      await authAPI.changePassword({ oldPassword: oldPwd, newPassword: newPwd })
      setPwdMsg({ type:'success', text:'Password changed successfully!' })
      setOldPwd(''); setNewPwd(''); setConfPwd('')
    } catch(e) {
      setPwdMsg({ type:'error', text: e?.response?.data?.message || 'Failed to change password' })
    } finally { setPwdLoad(false) }
  }

  const handleEmailToggle = async (val) => {
    setEmailAlert(val)
    try { await userAPI.toggleEmailAlerts({ emailAlerts: val }) }
    catch(e) { setEmailAlert(!val); console.error(e) }
  }

  const handleDarkToggle = async (val) => {
    setDarkMode(val)
    try { await userAPI.toggleDarkMode({ darkMode: val }) }
    catch(e) { setDarkMode(!val); console.error(e) }
  }

  const input = {
    width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(59,130,246,0.2)', color:'white', fontSize:13, outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <h2 style={{ color:'white', fontWeight:700, fontSize:20, margin:0 }}>Settings</h2>
        <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Manage your profile, security and preferences</p>
      </div>

      {/* ── Profile ── */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <User style={{ width:18, height:18, color:'white' }} />
          </div>
          <div>
            <h3 style={{ color:'white', fontWeight:700, fontSize:14, margin:0 }}>Profile Information</h3>
            <p style={{ color:'#64748b', fontSize:12, margin:0 }}>Update your display name</p>
          </div>
        </div>
        <Toast type={profMsg.type} msg={profMsg.text} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>Display Name</label>
            <input value={profEdit.name} onChange={e => setProfEdit(p => ({ ...p, name:e.target.value }))} placeholder="Your name" style={input} />
          </div>
          <div>
            <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>Email (read only)</label>
            <input value={profile.email} readOnly style={{ ...input, opacity:0.5, cursor:'not-allowed' }} />
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={profLoading}
          style={{ marginTop:16, display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', padding:'9px 20px', borderRadius:10, fontSize:13, fontWeight:700, cursor: profLoading?'not-allowed':'pointer', opacity:profLoading?0.7:1 }}>
          <Save style={{width:14,height:14}}/> {profLoading ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {/* ── Password ── */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1e3a8a,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Lock style={{ width:18, height:18, color:'white' }} />
          </div>
          <div>
            <h3 style={{ color:'white', fontWeight:700, fontSize:14, margin:0 }}>Change Password</h3>
            <p style={{ color:'#64748b', fontSize:12, margin:0 }}>Update your account password</p>
          </div>
        </div>
        <Toast type={pwdMsg.type} msg={pwdMsg.text} />
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:420 }}>
          {[
            { label:'Current Password', val:oldPwd,  set:setOldPwd,  show:showOld, toggle:setShowOld  },
            { label:'New Password',     val:newPwd,  set:setNewPwd,  show:showNew, toggle:setShowNew  },
            { label:'Confirm New Password', val:confPwd, set:setConfPwd, show:showNew, toggle:()=>{} },
          ].map(({ label, val, set, show, toggle }) => (
            <div key={label}>
              <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>{label}</label>
              <div style={{ position:'relative' }}>
                <input type={show ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} placeholder="••••••••"
                  style={{ ...input, paddingRight:40 }} />
                {label === 'Current Password' && (
                  <button type="button" onClick={() => toggle(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', display:'flex' }}>
                    {showOld ? <EyeOff style={{width:15,height:15}}/> : <Eye style={{width:15,height:15}}/>}
                  </button>
                )}
                {label === 'New Password' && (
                  <button type="button" onClick={() => setShowNew(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', display:'flex' }}>
                    {showNew ? <EyeOff style={{width:15,height:15}}/> : <Eye style={{width:15,height:15}}/>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleChangePassword} disabled={pwdLoad}
          style={{ marginTop:16, display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', color:'white', padding:'9px 20px', borderRadius:10, fontSize:13, fontWeight:700, cursor: pwdLoad?'not-allowed':'pointer', opacity:pwdLoad?0.7:1 }}>
          <Lock style={{width:14,height:14}}/> {pwdLoad ? 'Changing…' : 'Change Password'}
        </button>
      </div>

      {/* ── Preferences ── */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#155e75,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bell style={{ width:18, height:18, color:'white' }} />
          </div>
          <div>
            <h3 style={{ color:'white', fontWeight:700, fontSize:14, margin:0 }}>Preferences</h3>
            <p style={{ color:'#64748b', fontSize:12, margin:0 }}>Notifications and display settings</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {[
            { label:'Email Alerts', desc:'Get email notifications for high-risk activity', val:emailAlert, handler:handleEmailToggle, icon:Bell },
            { label:'Dark Mode',    desc:'Enable dark mode for the dashboard', val:darkMode, handler:handleDarkToggle, icon:Moon },
          ].map(({ label, desc, val, handler, icon: Icon }, i) => (
            <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'14px 0', borderBottom: i === 0 ? '1px solid rgba(59,130,246,0.1)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon style={{ width:15, height:15, color:'#60a5fa' }} />
                </div>
                <div>
                  <p style={{ color:'white', fontWeight:600, fontSize:13, margin:0 }}>{label}</p>
                  <p style={{ color:'#64748b', fontSize:11, margin:0 }}>{desc}</p>
                </div>
              </div>
              <Toggle checked={val} onChange={handler} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
