// pages/KeysPage.jsx
import React, { useState } from 'react'
import { KeyRound, Copy, Eye, EyeOff, RefreshCw, Download, ShieldCheck, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { downloadTextFile } from '../utils/rsaCrypto'

function KeyBox({ label, value, hidden, mono = true }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      <div className="mono-box" style={{ maxHeight: 110 }}>
        {hidden ? '•'.repeat(80) + '  (hidden)' : value || '—'}
      </div>
    </div>
  )
}

export default function KeysPage() {
  const { user, publicKeyPEM, privateKeyPEM, keysLoading, regenerateKeys } = useAuth()
  const [showPriv, setShowPriv] = useState(false)
  const [copied, setCopied]    = useState('')
  const [regen, setRegen]      = useState(false)

  const copy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label); setTimeout(() => setCopied(''), 1600)
  }

  const downloadKeys = () => {
    const content = `RSA KEY PAIR — RSA Document Verifier
======================================
User:    ${user?.username}
Exported: ${new Date().toISOString()}
Algorithm: RSASSA-PKCS1-v1_5 / SHA-256 / 2048-bit

${publicKeyPEM}

${privateKeyPEM}

⚠️  Keep your private key secret. Share only your public key.
`
    downloadTextFile(content, `${user?.username}-rsa-keys.txt`)
  }

  const handleRegen = async () => {
    if (!confirm('⚠️ Regenerating keys will make all previously signed files unverifiable with this account\'s key. Continue?')) return
    setRegen(true)
    try { await regenerateKeys() } finally { setRegen(false) }
  }

  const pubFingerprint = publicKeyPEM
    ? publicKeyPEM.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '').slice(-32)
    : '—'

  return (
    <div className="fade-in">
      <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Key Management</h1>
          <p className="page-subtitle">Manage your RSA 2048-bit key pair</p>
        </div>
        <button className="btn btn-danger" onClick={handleRegen} disabled={keysLoading || regen}>
          {(keysLoading || regen) ? <><Loader size={13} className="spin" /> Generating…</> : <><RefreshCw size={13} /> Regenerate Keys</>}
        </button>
      </div>

      {/* Key info card */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        {[
          { label: 'Key Algorithm',  value: 'RSASSA-PKCS1-v1_5', color: '#b794f4', gradient: 'linear-gradient(90deg,#b794f4,#9f7aea)' },
          { label: 'Key Size',       value: '2048 bit',           color: '#63b3ed', gradient: 'linear-gradient(90deg,#63b3ed,#4299e1)' },
          { label: 'Hash Algorithm', value: 'SHA-256',            color: '#68d391', gradient: 'linear-gradient(90deg,#68d391,#48bb78)' },
        ].map(({ label, value, color, gradient }) => (
          <div key={label} className="stat-card" style={{ '--accent-gradient': gradient }}>
            <div style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Public Key */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Public Key</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => copy(publicKeyPEM, 'pub')}>
                <Copy size={11} /> {copied === 'pub' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <KeyBox value={publicKeyPEM} />
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(183,148,244,.07)', borderRadius: 8, border: '1px solid rgba(183,148,244,.2)' }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Fingerprint (last 32 chars)</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#b794f4' }}>…{pubFingerprint}</p>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
            Share your public key with anyone who needs to verify your signatures. It is safe to distribute.
          </p>
        </div>

        {/* Private Key */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Private Key</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPriv(!showPriv)}>
                {showPriv ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => copy(privateKeyPEM, 'priv')}>
                <Copy size={11} /> {copied === 'priv' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <KeyBox value={privateKeyPEM} hidden={!showPriv} />
          <div className="alert alert-error" style={{ marginTop: 10, padding: '8px 12px', fontSize: 11 }}>
            ⚠️ Never share your private key. It is used to sign documents and stored only in this browser.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card" style={{ marginTop: 0 }}>
        <p className="section-label">Key Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={downloadKeys} disabled={!publicKeyPEM}>
            <Download size={13} /> Download Both Keys (.txt)
          </button>
          <button className="btn btn-ghost" onClick={() => copy(publicKeyPEM, 'pub-action')}>
            <Copy size={13} /> {copied === 'pub-action' ? 'Copied!' : 'Copy Public Key'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 12, lineHeight: 1.7 }}>
          Keys are persisted in your browser's IndexedDB and restored on every login. Keys are <strong style={{ color: '#94a3b8' }}>session-bound</strong> — clear browser data will erase them.
          Regenerating keys creates a new pair stored under your account.
        </p>
      </div>

      {/* About */}
      <div className="card" style={{ background: 'rgba(183,148,244,.04)', borderColor: 'rgba(183,148,244,.15)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <ShieldCheck size={18} color="#b794f4" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#b794f4', marginBottom: 6 }}>About RSA Key Pairs</p>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
              Your keys are generated using the <strong style={{ color: '#94a3b8' }}>WebCrypto API</strong> (RSASSA-PKCS1-v1_5 / SHA-256 / 2048-bit).
              The <strong style={{ color: '#94a3b8' }}>private key</strong> signs files — only you can sign.
              The <strong style={{ color: '#94a3b8' }}>public key</strong> verifies signatures — anyone can verify.
              Both keys are exported to PEM format and stored in <strong style={{ color: '#94a3b8' }}>IndexedDB</strong> locally on this device.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
