// pages/LoginPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login, register }     = useAuth()
  const navigate                = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) return setError('Fill in all fields')
    if (mode === 'register' && password !== confirm) return setError('Passwords do not match')
    if (mode === 'register' && username.length < 3) return setError('Username must be ≥ 3 characters')
    if (password.length < 6) return setError('Password must be ≥ 6 characters')
    setLoading(true)
    try {
      if (mode === 'login') await login(username.trim(), password)
      else await register(username.trim(), password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 1rem',
            background: 'rgba(99,179,237,.12)', border: '1px solid rgba(99,179,237,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={26} color="#63b3ed" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>RSA Document Verifier</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Cryptographic file authentication system
          </p>
        </div>

        {/* Mode tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError('') }}>Login</button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError('') }}>Register</button>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" placeholder="Enter username"
              value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPw ? 'text' : 'password'}
                placeholder="Enter password" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center'
              }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Re-enter password"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: 12 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '.75rem', fontSize: 14 }}>
            {loading
              ? <><Loader size={14} className="spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account & RSA keys…'}</>
              : mode === 'login' ? 'Sign in' : 'Create account'
            }
          </button>
        </form>

        {mode === 'register' && (
          <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
            RSA 2048-bit key pair is generated automatically on sign-up and stored locally in your browser.
          </p>
        )}

        <hr className="divider" />
        <p style={{ fontSize: 11, color: '#374151', textAlign: 'center' }}>
          All data is stored in your browser only. No server. No uploads.
        </p>
      </div>
    </div>
  )
}
