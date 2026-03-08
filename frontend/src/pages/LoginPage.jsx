import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Mail, Lock } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import AuthLayout from '../components/AuthLayout'

const inputStyle = {
  width: '100%', padding: '12px 14px 12px 44px', fontSize: 15,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const LoginPage = () => {
  const navigate = useNavigate()
  const { setUser, setToken, setError, error, setLoading, loading } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await authAPI.login(formData.email, formData.password)
      const { data } = response

      if (data.success) {
        setToken(data.token)
        setUser(data)

        // Redirect based on role
        if (data.role === 'ROLE_PARENT') {
          navigate('/parent-dashboard')
        } else if (data.role === 'ROLE_CHILD') {
          navigate('/child-dashboard')
        } else {
          navigate('/')
        }
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Page heading */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Welcome back</p>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>Sign in to your account</h2>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Create one for free →</Link>
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />
          <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#d1d5db', marginBottom: 8 }}>Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#4b5563' }} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              style={inputStyle}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#d1d5db' }}>Password</label>
            <a href="#" style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#4b5563' }} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              style={inputStyle}
            />
          </div>
        </div>

        {/* Remember me */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: 14, color: '#9ca3af', cursor: 'pointer' }}>Keep me signed in for 30 days</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px 24px', fontSize: 15, fontWeight: 700,
            background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(59,130,246,0.3)', transition: 'all 0.2s', letterSpacing: '-0.2px',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 13, color: '#4b5563' }}>Demo accounts</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Demo credentials */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { role: 'Parent', email: 'parent@example.com', pass: 'password123', color: '#3b82f6' },
            { role: 'Child', email: 'child@example.com', pass: 'password123', color: '#60a5fa' },
          ].map(({ role, email, pass, color }) => (
            <div key={role} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{role}</p>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{email}</p>
              <p style={{ fontSize: 12, color: '#4b5563' }}>{pass}</p>
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
