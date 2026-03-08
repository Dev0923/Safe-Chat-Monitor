import React, { useState, useEffect } from 'react'
import { User, Lock, Eye, EyeOff, Save, Shield, Bell, CheckCircle, AlertTriangle, Mail, Wifi, WifiOff, RefreshCw, Link, Unlink } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { userAPI, authAPI, gmailAPI } from '../../services/api'

const Section = ({ title, icon: Icon, children }) => (
  <div className="rounded-2xl p-5 space-y-4"
    style={{ background:'rgba(17,25,40,0.85)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)' }}>
    <div className="flex items-center gap-2.5 pb-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-blue-400" />
      </div>
      <h3 className="text-white font-semibold text-sm">{title}</h3>
    </div>
    {children}
  </div>
)

const FieldRow = ({ label, children }) => (
  <div>
    <label className="block text-gray-400 text-xs mb-1.5">{label}</label>
    {children}
  </div>
)

export default function ChildSettingsPanel() {
  const { user, setUser } = useAuthStore()

  /* profile */
  const [name,    setName]    = useState(user?.name    || '')
  const [email,   setEmail]   = useState(user?.email   || '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')

  /* password */
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [showCur,    setShowCur]    = useState(false)
  const [showNew,    setShowNew]    = useState(false)
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwSaved,    setPwSaved]    = useState(false)
  const [pwErr,      setPwErr]      = useState('')

  /* preferences */
  const [notifEmail,  setNotifEmail]  = useState(true)
  const [notifAlerts, setNotifAlerts] = useState(true)
  
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError]     = useState('');
  const [gmailStatus, setGmailStatus]   = useState(null); // null = loading, { connected, email }

  // Fetch live Gmail status from backend on mount
  useEffect(() => {
    const childId = user?.childId
    if (!childId) { setGmailStatus({ connected: false, email: null }); return }
    gmailAPI.getStatus(childId)
      .then(res => setGmailStatus({ connected: res.data.connected, email: res.data.email }))
      .catch(() => setGmailStatus({ connected: false, email: null }))
  }, [user?.childId])

  const connectGmail = async () => {
    const childId = user?.childId
    if (!childId) {
      setGmailError('No child profile linked to this account. Ask a parent to link your account first.')
      return
    }
    setGmailLoading(true); setGmailError('');
    try {
      if (gmailStatus?.connected) {
         await gmailAPI.disconnect(childId);
         setGmailStatus({ connected: false, email: null });
         setUser({ ...user, googleConnected: false });
      } else {
         const res = await gmailAPI.connect(childId);
         if (res.data.url) {
           window.location.href = res.data.url;
         }
      }
    } catch (err) {
      console.error(err);
      setGmailError('Failed to connect/disconnect Gmail.');
    } finally {
      setGmailLoading(false);
    }
  };

  const syncGmail = async () => {
    const childId = user?.childId
    if (!childId) {
      setGmailError('No child profile linked to this account.')
      return
    }
    setGmailLoading(true); setGmailError('');
    try {
      await gmailAPI.sync(childId);
      alert('Gmail sync started!');
    } catch (err) {
      setGmailError('Failed to sync Gmail.');
    } finally {
      setGmailLoading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true); setSaved(false); setSaveErr('')
    try {
      const res = await userAPI.updateProfile(user?.id, { name, email })
      if (res?.data) setUser({ ...user, ...res.data })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Failed to save profile.')
    } finally { setSaving(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwErr('')
    if (newPw.length < 6)        { setPwErr('New password must be at least 6 characters.'); return }
    if (newPw !== confirmPw)     { setPwErr('Passwords do not match.'); return }
    setPwSaving(true)
    try {
      const changeFn = authAPI?.changePassword || userAPI?.changePassword
      if (!changeFn) throw new Error('Password change unavailable. Please contact a parent.')
      await changeFn({ currentPassword: currentPw, newPassword: newPw })
      setPwSaved(true); setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      setPwErr(err?.response?.data?.message || 'Failed to change password.')
    } finally { setPwSaving(false) }
  }

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition-all'
  const inputStyle = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="space-y-5 max-w-2xl">

      <div>
        <h2 className="text-white font-bold text-xl">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile Information" icon={User}>
        <form onSubmit={saveProfile} className="space-y-3">
          <FieldRow label="Display Name">
            <input value={name} onChange={e => setName(e.target.value)}
              className={inputCls} style={inputStyle} placeholder="Your name" />
          </FieldRow>
          <FieldRow label="Email Address">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              className={inputCls} style={inputStyle} placeholder="your@email.com" />
          </FieldRow>
          <FieldRow label="Account Role">
            <div className="px-3.5 py-2.5 rounded-xl text-gray-400 text-sm capitalize"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              {user?.role?.toLowerCase() || 'child'}
            </div>
          </FieldRow>
          {saveErr && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />Profile saved successfully!
            </div>
          )}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={changePassword} className="space-y-3">
          <FieldRow label="Current Password">
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                className={inputCls + ' pr-10'} style={inputStyle} placeholder="••••••••" />
              <button type="button" onClick={() => setShowCur(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FieldRow>
          <FieldRow label="New Password">
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                className={inputCls + ' pr-10'} style={inputStyle} placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FieldRow>
          <FieldRow label="Confirm New Password">
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className={inputCls} style={inputStyle} placeholder="Repeat new password" />
          </FieldRow>
          {/* strength bar */}
          {newPw.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    newPw.length >= (i + 1) * 3
                      ? i < 1 ? 'bg-red-500' : i < 2 ? 'bg-amber-500' : i < 3 ? 'bg-blue-500' : 'bg-emerald-500'
                      : 'bg-white/10'
                  }`} />
                ))}
              </div>
              <p className="text-gray-500 text-xs">{
                newPw.length < 4 ? 'Weak' : newPw.length < 7 ? 'Fair' : newPw.length < 10 ? 'Good' : 'Strong'
              } password</p>
            </div>
          )}
          {pwErr && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{pwErr}
            </div>
          )}
          {pwSaved && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />Password changed successfully!
            </div>
          )}
          <button type="submit" disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20">
            <Lock className="w-4 h-4" />
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Section>

      {/* Connected Accounts */}
      <Section title="Connected Accounts" icon={Mail}>
         <div className="space-y-4">

           {/* Gmail Status Card */}
           <div className={`rounded-2xl p-4 transition-all duration-300 ${
             gmailStatus?.connected
               ? 'border border-emerald-500/30 bg-emerald-500/5'
               : 'border border-white/7'
           }`} style={gmailStatus?.connected ? {} : { background: 'rgba(255,255,255,0.04)' }}>

             {/* Top row: icon + info + status badge */}
             <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 {/* Gmail logo bubble */}
                 <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                   gmailStatus?.connected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-white/10'
                 }`}>
                   <img
                     src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                     alt="Gmail"
                     className="w-6 h-6"
                   />
                 </div>

                 <div>
                   <div className="flex items-center gap-2">
                     <h4 className="text-white text-sm font-semibold">Google / Gmail</h4>
                     {/* Connection status badge */}
                     {gmailStatus === null ? (
                       <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
                         <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                         Checking...
                       </span>
                     ) : gmailStatus.connected ? (
                       <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                         Connected
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-500 border border-white/10">
                         <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                         Not Connected
                       </span>
                     )}
                   </div>

                   {/* Subtitle: show connected email or description */}
                   {gmailStatus?.connected && gmailStatus.email ? (
                     <p className="text-emerald-400/80 text-xs mt-0.5 font-medium">{gmailStatus.email}</p>
                   ) : (
                     <p className="text-gray-500 text-xs mt-0.5">Analyze received emails for risks</p>
                   )}
                 </div>
               </div>

               {/* Action buttons */}
               <div className="flex flex-col items-end gap-2 flex-shrink-0">
                 {gmailStatus?.connected ? (
                   <>
                     <button
                       onClick={connectGmail}
                       disabled={gmailLoading}
                       className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                     >
                       <Unlink className="w-3.5 h-3.5" />
                       {gmailLoading ? 'Disconnecting...' : 'Disconnect'}
                     </button>
                     <button
                       onClick={syncGmail}
                       disabled={gmailLoading}
                       className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                     >
                       <RefreshCw className={`w-3 h-3 ${gmailLoading ? 'animate-spin' : ''}`} />
                       Sync Now
                     </button>
                   </>
                 ) : (
                   <button
                     onClick={connectGmail}
                     disabled={gmailLoading || gmailStatus === null}
                     className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
                   >
                     <Link className="w-3.5 h-3.5" />
                     {gmailLoading ? 'Connecting...' : 'Connect Gmail'}
                   </button>
                 )}
               </div>
             </div>

             {/* Connected info bar */}
             {gmailStatus?.connected && (
               <div className="mt-3 flex items-center gap-2 pt-3 border-t border-emerald-500/10">
                 <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                 <p className="text-emerald-400/70 text-xs">Gmail is connected. Your emails are being monitored for safety.</p>
               </div>
             )}

             {/* Not connected hint */}
             {gmailStatus && !gmailStatus.connected && (
               <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/5">
                 <WifiOff className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                 <p className="text-gray-600 text-xs">Connect Gmail to enable email safety monitoring.</p>
               </div>
             )}
           </div>

           {gmailError && (
             <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
               <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{gmailError}
             </div>
           )}
         </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences" icon={Bell}>
        <div className="space-y-3">
          {[
            { label:'Email Notifications',   sub:'Receive alerts by email',                  val: notifEmail,  set: setNotifEmail  },
            { label:'Safety Alerts',          sub:'Get notified when a high-risk msg is sent', val: notifAlerts, set: setNotifAlerts },
          ].map((pref, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-white text-sm font-medium">{pref.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{pref.sub}</p>
              </div>
              <button onClick={() => pref.set(v => !v)}
                className={`w-11 h-6 rounded-full relative transition-all duration-200 ${pref.val ? 'bg-blue-600' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${pref.val ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Safety info */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background:'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,58,95,0.5))', border:'1px solid rgba(59,130,246,0.2)' }}>
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm mb-0.5">Your Safety Matters</p>
          <p className="text-gray-400 text-xs leading-relaxed">If anything online makes you uncomfortable, please tell a parent or trusted adult. Your safety always comes first.</p>
        </div>
      </div>

    </div>
  )
}
