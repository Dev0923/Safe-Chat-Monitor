import React, { useEffect, useState } from 'react'
import { BookOpen, Sparkles, Shield, Lock, Brain } from 'lucide-react'

const floatingIcons = [
  { Icon: Shield,   top: '12%',  left: '8%',  size: 20, delay: '0s',    dur: '3.2s' },
  { Icon: BookOpen, top: '20%',  left: '88%', size: 18, delay: '0.6s',  dur: '3.8s' },
  { Icon: Lock,     top: '70%',  left: '5%',  size: 16, delay: '1.2s',  dur: '4.1s' },
  { Icon: Brain,    top: '75%',  left: '90%', size: 20, delay: '0.3s',  dur: '3.5s' },
  { Icon: Sparkles, top: '45%',  left: '3%',  size: 14, delay: '0.9s',  dur: '2.9s' },
  { Icon: Sparkles, top: '50%',  left: '94%', size: 14, delay: '1.5s',  dur: '3.3s' },
]

export default function CyberSafetyLearningPanel() {
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const id = setInterval(() => setDotCount(d => (d % 3) + 1), 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden select-none">

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.18; }
          50%       { transform: translateY(-18px) rotate(8deg); opacity: 0.38; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.45; }
          70%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        .cs-float     { animation: floatY var(--dur) var(--delay) ease-in-out infinite; }
        .cs-pulse     { animation: pulse-ring 2s ease-out infinite; }
        .cs-fade-1    { animation: fadeSlideUp 0.7s ease both; }
        .cs-fade-2    { animation: fadeSlideUp 0.7s 0.18s ease both; }
        .cs-fade-3    { animation: fadeSlideUp 0.7s 0.34s ease both; }
        .cs-fade-4    { animation: fadeSlideUp 0.7s 0.50s ease both; }
        .cs-shimmer {
          background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 30%, #34d399 60%, #60a5fa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .cs-orbit     { animation: spin-slow 12s linear infinite; }
        .cs-orbit-rev { animation: spin-slow 18s linear infinite reverse; }
      `}</style>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position:'absolute', top:'30%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:420, height:420,
          background:'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)',
          borderRadius:'50%',
        }} />
        <div style={{
          position:'absolute', top:'65%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:280, height:280,
          background:'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          borderRadius:'50%',
        }} />
      </div>

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, top, left, size, delay, dur }, i) => (
        <div key={i} className="cs-float absolute pointer-events-none"
          style={{ top, left, '--delay': delay, '--dur': dur }}>
          <Icon style={{ width: size, height: size, color: 'rgba(99,102,241,0.55)' }} />
        </div>
      ))}

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-14 rounded-3xl max-w-lg w-full mx-4"
        style={{
          background: 'rgba(17,25,40,0.88)',
          border: '1px solid rgba(255,255,255,0.09)',
          backdropFilter: 'blur(20px)',
        }}>

        {/* Icon with pulsing rings */}
        <div className="relative mb-10 cs-fade-1">
          <div className="cs-pulse absolute inset-0 rounded-full border-2 border-blue-500/40" style={{ animationDelay: '0s' }} />
          <div className="cs-pulse absolute inset-0 rounded-full border-2 border-violet-500/30" style={{ animationDelay: '0.6s' }} />

          {/* Orbit ring */}
          <div className="cs-orbit absolute" style={{
            top: -18, left: -18, right: -18, bottom: -18,
            border: '1px dashed rgba(99,102,241,0.25)', borderRadius: '50%',
          }}>
            <div style={{
              position:'absolute', top: -4, left: '50%', transform:'translateX(-50%)',
              width:8, height:8, borderRadius:'50%',
              background:'rgba(99,102,241,0.8)',
              boxShadow:'0 0 8px rgba(99,102,241,0.9)',
            }} />
          </div>

          {/* Counter-orbit ring */}
          <div className="cs-orbit-rev absolute" style={{
            top: -32, left: -32, right: -32, bottom: -32,
            border: '1px dashed rgba(52,211,153,0.15)', borderRadius: '50%',
          }}>
            <div style={{
              position:'absolute', bottom: -4, left: '50%', transform:'translateX(-50%)',
              width:6, height:6, borderRadius:'50%',
              background:'rgba(52,211,153,0.6)',
              boxShadow:'0 0 6px rgba(52,211,153,0.8)',
            }} />
          </div>

          {/* Center icon */}
          <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background:'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(124,58,237,0.25) 100%)',
              border:'1px solid rgba(99,102,241,0.4)',
              boxShadow:'0 0 32px rgba(99,102,241,0.2)',
            }}>
            <BookOpen className="w-9 h-9 text-blue-300" />
          </div>
        </div>

        {/* Title */}
        <h2 className="font-black text-4xl tracking-tight mb-3 cs-shimmer cs-fade-2">
          Coming Soon
        </h2>

        {/* Animated dot indicator */}
        <div className="flex items-center gap-2 mb-5 cs-fade-3">
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              transition: 'all 0.3s ease',
              background: i < dotCount ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.12)',
              boxShadow: i < dotCount ? '0 0 8px rgba(99,102,241,0.6)' : 'none',
              transform: i < dotCount ? 'scale(1.2)' : 'scale(1)',
            }} />
          ))}
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed max-w-sm cs-fade-4">
          We're building an exciting AI-powered cyber safety learning experience just for you.
          Interactive lessons, quizzes, and tips are on their way!
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 cs-fade-4">
          {[
            { label: 'AI Lessons',      color: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  text: '#93c5fd' },
            { label: 'Safety Quizzes',  color: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)',  text: '#c4b5fd' },
            { label: 'Daily Tips',      color: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
            { label: 'Progress Badges', color: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
          ].map(({ label, color, border, text }) => (
            <span key={label} className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: color, border: `1px solid ${border}`, color: text }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

