import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ParentDashboard from './pages/ParentDashboard'
import ChildDashboard from './pages/ChildDashboard'
import SettingsPage from './pages/SettingsPage'
import LandingPage from './pages/LandingPage'
import GoogleCallback from './pages/GoogleCallback' // Import new page

// Components
import PrivateRoute from './components/PrivateRoute'
import Navigation from './components/Navigation'

// Navigation wrapper — hides top nav on child-dashboard (has its own sidebar)
const ConditionalNav = () => {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const isChildDashboard = location.pathname === '/child-dashboard'
  const isParentDashboard = location.pathname === '/parent-dashboard'
  if (!isAuthenticated || isChildDashboard || isParentDashboard) return null
  return <Navigation />
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConditionalNav />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Protected Routes */}
        <Route 
          path="/parent-dashboard" 
          element={<PrivateRoute><ParentDashboard /></PrivateRoute>} 
        />
        <Route 
          path="/child-dashboard" 
          element={<PrivateRoute><ChildDashboard /></PrivateRoute>} 
        />
        <Route 
          path="/settings" 
          element={<PrivateRoute><SettingsPage /></PrivateRoute>} 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
