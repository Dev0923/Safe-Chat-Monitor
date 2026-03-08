import React from 'react'
import { Users, Shield, Star, Award, Heart } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { RobotMascot } from './shared'

const Badge = ({ icon: Icon, label, color }) => (
  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${color}`}>
    <Icon className="w-5 h-5 opacity-80" />
    <span className="text-xs font-semibold text-center leading-tight">{label}</span>
  </div>
)

export default function ChildrenPanel() {
  const { user } = useAuthStore()
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'C'
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month:'long', year:'numeric' }) : 'Recently'

  return (
    <div className="space-y-5 max-w-2xl">

      <div>
        <h2 className="text-white font-bold text-xl">My Profile</h2>
        <p className="text-gray-500 text-sm mt-1">Your account info and achievements</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-6" style={{
        background:'linear-gradient(135deg, rgba(17,25,40,0.9) 0%, rgba(30,58,95,0.5) 100%)',
        border:'1px solid rgba(59,130,246,0.2)',
        backdropFilter:'blur(16px)',
      }}>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-blue-500/40">
              <span className="text-white font-black text-3xl">{initial}</span>
            </div>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-xl">{user?.name || 'Child User'}</h3>
            <p className="text-gray-400 text-sm mt-0.5">{user?.email || ''}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 capitalize">
                {user?.role?.toLowerCase() || 'child'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>
            <p className="text-gray-600 text-xs mt-2">Member since {joinDate}</p>
          </div>
          {/* Mascot */}
          <div className="flex-shrink-0 hidden sm:block" style={{ width:80, height:96 }}>
            <RobotMascot />
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl p-5" style={{ background:'rgba(17,25,40,0.85)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)' }}>
        <div className="flex items-center gap-2.5 pb-3 mb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold text-sm">Safety Achievements</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Badge icon={Shield}  label="Safety First"   color="text-blue-400 border-blue-500/20 bg-blue-500/8"     />
          <Badge icon={Star}    label="Quiz Master"    color="text-amber-400 border-amber-500/20 bg-amber-500/8"   />
          <Badge icon={Heart}   label="Trusted User"   color="text-red-400 border-red-500/20 bg-red-500/8"         />
          <Badge icon={Award}   label="Explorer"       color="text-emerald-400 border-emerald-500/20 bg-emerald-500/8" />
        </div>
      </div>

      {/* Safety rules */}
      <div className="rounded-2xl p-5" style={{ background:'rgba(17,25,40,0.85)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)' }}>
        <div className="flex items-center gap-2.5 pb-3 mb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-white font-semibold text-sm">My Safety Pledge</h3>
        </div>
        <div className="space-y-2.5">
          {[
            { text: 'I will never share personal info with strangers online.',        color:'text-emerald-400' },
            { text: 'I will tell a trusted adult if something makes me uncomfortable.', color:'text-blue-400'   },
            { text: 'I will think before I share photos or messages.',                 color:'text-amber-400'  },
            { text: 'I will only meet online friends in person with a parent present.', color:'text-purple-400' },
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className={`text-sm font-bold flex-shrink-0 w-5 text-center ${rule.color}`}>{i + 1}</div>
              <p className="text-gray-300 text-sm leading-relaxed">{rule.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parents linked */}
      <div className="rounded-2xl p-5" style={{ background:'rgba(17,25,40,0.85)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)' }}>
        <div className="flex items-center gap-2.5 pb-3 mb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-semibold text-sm">Linked Guardians</h3>
        </div>
        <div className="flex items-center gap-4 p-3 rounded-xl"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Parent / Guardian</p>
            <p className="text-gray-500 text-xs">Your activity is monitored to keep you safe</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">Active</span>
          </div>
        </div>
      </div>

    </div>
  )
}
