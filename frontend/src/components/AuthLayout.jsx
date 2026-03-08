import React from 'react'
import { Link } from 'react-router-dom'

const AuthLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif', background: '#000' }}>

      {/* ── LEFT PANEL — Video background ─────────────── */}
      <div style={{
        width: '46%',
        minWidth: 460,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 52px 48px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {/* Looping video — fills the entire left panel */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }}
        >
          <source src="/signup.mp4" type="video/mp4" />
        </video>

        {/* Thin dark scrim so text stays legible without hiding the video */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.58) 100%)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: '#3b82f6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>SafeMonitor</span>
          </Link>
        </div>

        {/* Center headline */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 3.2vw, 3.2rem)', fontWeight: 900, color: '#fff',
            lineHeight: 1.12, letterSpacing: '-1.5px', margin: 0,
          }}>
            Protect Your Child<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Before Harm Happens
            </span>
          </h1>
        </div>

        {/* Bottom trust badge */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }} />
            <span style={{ color: '#6b7280', fontSize: 12 }}>10,000+ families protected worldwide</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: '#050507',
        position: 'relative',
        overflowY: 'auto',
      }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
          {children}
        </div>
      </div>

    </div>
  )
}

export default AuthLayout
