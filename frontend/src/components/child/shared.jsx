// ─── Shared constants, SVGs and helpers for child dashboard panels ───────────

export const riskConfig = {
  SAFE:   { icon: 'CheckCircle',   iconColor: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/8',  label: 'Safe',   dot: 'bg-emerald-400', hex: '#10b981' },
  LOW:    { icon: 'CheckCircle',   iconColor: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/8',  label: 'Safe',   dot: 'bg-emerald-400', hex: '#10b981' },
  MEDIUM: { icon: 'AlertTriangle', iconColor: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/8',    label: 'Medium', dot: 'bg-amber-400',   hex: '#f59e0b' },
  HIGH:   { icon: 'Shield',        iconColor: 'text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/8',      label: 'Unsafe', dot: 'bg-red-400',     hex: '#ef4444' },
  ERROR:  { icon: 'AlertTriangle', iconColor: 'text-gray-400',    border: 'border-white/10',       bg: 'bg-white/3',        label: 'Error',  dot: 'bg-gray-400',    hex: '#6b7280' },
}

export const cardStyle = {
  background: 'rgba(17,25,40,0.85)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
  borderRadius: '1rem',
  padding: '1.25rem',
}

export const quizQuestions = [
  { q: 'Is it safe to share your phone number with strangers online?',            a: 'No'  },
  { q: 'Should you meet someone in person that you only know from online?',       a: 'No'  },
  { q: 'Is it okay to share your home address with a new online friend?',         a: 'No'  },
  { q: 'If someone online makes you uncomfortable, should you tell a trusted adult?', a: 'Yes' },
  { q: 'Can photos you post online be shared by others without your permission?', a: 'Yes' },
  { q: 'Should you use the same password for every website?',                     a: 'No'  },
  { q: 'Is it safe to click on links from people you don\'t know?',               a: 'No'  },
]

export const dailyTips = [
  { headline: 'Never share personal photos online!',  bullets: ['Keep your private pictures private.', 'Only share photos with trusted family.'] },
  { headline: 'Use strong, unique passwords!',        bullets: ['Mix letters, numbers and symbols.', 'Never share passwords with friends.']     },
  { headline: 'Think before you click!',              bullets: ['Avoid suspicious links or pop-ups.', 'Ask an adult if you are not sure.']       },
  { headline: 'Protect your personal information!',   bullets: ['Never share your address or school online.', 'Real friends don\'t need your info.'] },
]

export const RobotMascot = () => (
  <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <ellipse cx="80" cy="160" rx="55" ry="14" fill="#10b98133" />
    <rect x="30" y="80" width="100" height="75" rx="22" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <path d="M65 100 L80 95 L95 100 L95 120 Q80 130 65 120 Z" fill="#10b981" opacity="0.9"/>
    <path d="M72 110 L78 116 L88 106" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="8" y="90" width="22" height="48" rx="11" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <rect x="130" y="90" width="22" height="48" rx="11" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <circle cx="19" cy="145" r="8" fill="#2563eb" stroke="#3b82f6" strokeWidth="1.2"/>
    <circle cx="141" cy="137" r="8" fill="#2563eb" stroke="#3b82f6" strokeWidth="1.2"/>
    <rect x="50" y="150" width="26" height="24" rx="10" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <rect x="84" y="150" width="26" height="24" rx="10" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <rect x="68" y="62" width="24" height="20" rx="6" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <rect x="22" y="12" width="116" height="52" rx="20" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <line x1="80" y1="12" x2="80" y2="2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="80" cy="0" r="4" fill="#60a5fa"/>
    <rect x="38" y="24" width="32" height="22" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.2"/>
    <rect x="90" y="24" width="32" height="22" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.2"/>
    <circle cx="54" cy="35" r="7" fill="#10b981" opacity="0.9"/>
    <circle cx="106" cy="35" r="7" fill="#10b981" opacity="0.9"/>
    <circle cx="56" cy="33" r="2.5" fill="white" opacity="0.7"/>
    <circle cx="108" cy="33" r="2.5" fill="white" opacity="0.7"/>
    <path d="M58 52 Q80 62 102 52" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="20" r="2" fill="#fbbf24" opacity="0.8"/>
    <circle cx="145" cy="15" r="1.5" fill="#60a5fa" opacity="0.8"/>
    <circle cx="15" cy="50" r="1.5" fill="#10b981" opacity="0.6"/>
    <circle cx="150" cy="55" r="2" fill="#fbbf24" opacity="0.7"/>
  </svg>
)

export const ShieldBadgeIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <path d="M20 3 L34 9 L34 22 Q34 31 20 37 Q6 31 6 22 L6 9 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5"/>
    <path d="M20 3 L34 9 L34 22 Q34 31 20 37 Q6 31 6 22 L6 9 Z" fill="#10b981" opacity="0.2"/>
    <path d="M14 20 L18 24 L26 16" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const formatTime = (date) =>
  new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
