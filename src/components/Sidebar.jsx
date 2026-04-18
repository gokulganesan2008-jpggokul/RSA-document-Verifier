// components/Sidebar.jsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FilePen, ShieldCheck, Globe,
  ClipboardList, KeyRound, LogOut, Shield
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/sign',      label: 'Sign File',        icon: FilePen },
  { path: '/verify',    label: 'Verify File',      icon: ShieldCheck },
  { path: '/portal',   label: 'Public Portal',    icon: Globe },
  { path: '/audit',    label: 'Audit Trail',      icon: ClipboardList },
  { path: '/keys',     label: 'Key Management',   icon: KeyRound },
]

export default function Sidebar() {
  const { user, logout, keysLoading } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??'

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={18} color="#63b3ed" />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>RSA Verifier</p>
          <p style={{ fontSize: 10, color: '#64748b' }}>Document Authentication</p>
        </div>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="avatar">{initials}</div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.username}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: keysLoading ? '#f6ad55' : '#68d391',
              display: 'inline-block',
              boxShadow: keysLoading ? '0 0 5px #f6ad55' : '0 0 5px #68d391'
            }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>
              {keysLoading ? 'Loading keys…' : 'Keys active'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-bottom">
        <button className="nav-item" style={{ color: '#fc8181', width: '100%' }} onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
        <p style={{ fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 10 }}>
          WebCrypto · Client-side only
        </p>
      </div>
    </aside>
  )
}
