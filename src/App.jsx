// App.jsx — Main router and layout
import React from 'react'
import {
  BrowserRouter, Routes, Route, Navigate, Outlet, useLocation
} from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar       from './components/Sidebar'
import LoginPage     from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SignerPage    from './pages/SignerPage'
import VerifyPage    from './pages/VerifyPage'
import PortalPage    from './pages/PortalPage'
import AuditPage     from './pages/AuditPage'
import KeysPage      from './pages/KeysPage'

// ── Auth guard ────────────────────────────────────────────────────────────────
function RequireAuth() {
  const { user, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(99,179,237,.3)', borderTop: '2px solid #63b3ed', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin .8s linear infinite' }} />
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const { user, authLoading } = useAuth()
  if (authLoading) return null
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/portal"         element={<PortalPage />} />
          <Route path="/portal/:id"     element={<PortalPage />} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/sign"         element={<SignerPage />} />
            <Route path="/verify"       element={<VerifyPage />} />
            <Route path="/audit"        element={<AuditPage />} />
            <Route path="/keys"         element={<KeysPage />} />
          </Route>

          {/* Root */}
          <Route path="/"              element={<RootRedirect />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
