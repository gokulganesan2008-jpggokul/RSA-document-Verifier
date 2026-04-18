// components/KeyPanel.jsx
import React, { useState } from 'react'
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react'
import Card from './Card'
import SectionLabel from './SectionLabel'
import Button from './Button'

const monoBox = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  background: '#0f1628',
  border: '0.5px solid rgba(99,179,237,0.12)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#64748b',
  wordBreak: 'break-all',
  maxHeight: 80,
  overflowY: 'auto',
  lineHeight: 1.5,
  marginBottom: 10,
}

export default function KeyPanel({ publicKeyPEM, privateKeyPEM, loading, regenerate }) {
  const [showPriv, setShowPriv] = useState(false)
  const [copied, setCopied] = useState('')

  const copy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel>RSA key pair (2048-bit)</SectionLabel>
        <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading}>
          <RefreshCw size={12} /> {loading ? 'Generating…' : 'Regenerate'}
        </Button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b', fontSize: 13 }}>Generating RSA keys via WebCrypto…</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Public key</span>
            <button onClick={() => copy(publicKeyPEM, 'pub')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Copy size={11} /> {copied === 'pub' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={monoBox}>{publicKeyPEM}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Private key</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowPriv(!showPriv)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                {showPriv ? <EyeOff size={11} /> : <Eye size={11} />} {showPriv ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => copy(privateKeyPEM, 'priv')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Copy size={11} /> {copied === 'priv' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={monoBox}>
            {showPriv ? privateKeyPEM : '•'.repeat(60) + '  (hidden for security)'}
          </div>

          <p style={{ fontSize: 11, color: '#64748b' }}>
            Keys are session-only — they reset on page reload. Generated using RSASSA-PKCS1-v1_5 / SHA-256.
          </p>
        </>
      )}
    </Card>
  )
}
