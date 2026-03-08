import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Mail, Lock, User } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import AuthLayout from '../components/AuthLayout'

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 7 }
const iconStyle = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4b5563' }
const inputStyle = {
  width: '100%', padding: '11px 12px 11px 38px', fontSize: 14,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9, color: '#fff', outline: 'none', boxSizing: 'border-box',
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const { setUser, setToken, setError, error, setLoading, loading } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PARENT',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      )

      const { data } = response

      if (data.success) {
        // Auto-login after registration
        const loginResponse = await authAPI.login(formData.email, formData.password)
        const loginData = loginResponse.data

        if (loginData.success) {
          setToken(loginData.token)
          setUser(loginData)

          if (loginData.role === 'ROLE_PARENT') {
            navigate('/parent-dashboard')
          } else if (loginData.role === 'ROLE_CHILD') {
            navigate('/child-dashboard')
          } else {
            navigate('/')
          }
        }
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: '#10b981', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Get started free</p>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>Create your account</h2>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />
          <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Name + Email row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <div style={{ position: 'relative' }}>
              <User style={iconStyle} />
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={iconStyle} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Password — full width */}
        <div>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock style={iconStyle} />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" required style={inputStyle} />
          </div>
        </div>

        {/* Role selector */}
        <div>
          <label style={labelStyle}>I am a…</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              {
                value: 'PARENT',
                label: 'Parent',
                desc: 'Monitor & protect my child',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                ),
              },
              {
                value: 'CHILD',
                label: 'Child',
                desc: 'Stay safe with guidance',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M12 14c-5 0-8 2-8 4v1h16v-1c0-2-3-4-8-4z" />
                    <path d="M9 21l3-3 3 3" />
                  </svg>
                ),
              },
            ].map(({ value, label, desc, icon }) => {
              const selected = formData.role === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: value }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '16px 12px', borderRadius: 12, cursor: 'pointer',
                    background: selected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1.5px solid #10b981' : '1.5px solid rgba(255,255,255,0.1)',
                    color: selected ? '#34d399' : '#6b7280',
                    transition: 'all 0.18s',
                  }}
                >
                  <span style={{ color: selected ? '#34d399' : '#6b7280' }}>{icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: selected ? '#fff' : '#9ca3af' }}>{label}</span>
                  <span style={{ fontSize: 12, color: selected ? '#6ee7b7' : '#4b5563', textAlign: 'center', lineHeight: 1.4 }}>{desc}</span>
                  {selected && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 18, height: 18, borderRadius: '50%', background: '#10b981',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Terms notice */}
        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
          By creating an account you agree to our{' '}
          <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</a>{' '}and{' '}
          <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px 24px', fontSize: 15, fontWeight: 700,
            background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(16,185,129,0.3)', transition: 'all 0.2s', letterSpacing: '-0.2px',
            marginTop: 4,
          }}
        >
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      {/* Feature chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
        {['Free to start', '5-min setup', 'No credit card'].map((text) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
