// modules/VerifyModule.jsx
import React, { useState } from 'react'
import { ShieldCheck, ShieldX, Loader } from 'lucide-react'
import Card from '../components/Card'
import DropZone from '../components/DropZone'
import Button from '../components/Button'
import KeyPanel from '../components/KeyPanel'
import SectionLabel from '../components/SectionLabel'
import { hashFile, signFile, verifySignature, arrayBufferToHex } from '../utils/rsaCrypto'

export default function VerifyModule({ keyPair, publicKeyPEM, privateKeyPEM, loading: keysLoading, regenerate }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null) // null | 'loading' | 'original' | 'tampered' | 'error'
  const [details, setDetails] = useState({})

  const handleFile = (f) => { setFile(f); setStatus(null) }

  const verify = async () => {
    if (!file || !keyPair) return
    setStatus('loading')
    try {
      await new Promise(r => setTimeout(r, 600))
      const { hashBuffer, signature } = await signFile(file, keyPair.privateKey)
      const isValid = await verifySignature(hashBuffer, signature, keyPair.publicKey)
      const hashHex = arrayBufferToHex(hashBuffer)
      const sigHex = arrayBufferToHex(signature)
      setDetails({ hashHex, sigHex: sigHex.slice(0, 64) + '…', fileSize: (file.size / 1024).toFixed(2), fileName: file.name })
      setStatus(isValid ? 'original' : 'tampered')
    } catch (e) {
      setDetails({ error: e.message })
      setStatus('error')
    }
  }

  return (
    <div>
      <Card>
        <SectionLabel>Upload file to verify</SectionLabel>
        <DropZone file={file} onFile={handleFile} accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.txt,.csv,.xml,.json" />
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <Button onClick={verify} disabled={!file || keysLoading || status === 'loading'}>
            {status === 'loading' ? <><Loader size={13} className="spin" /> Verifying…</> : <><ShieldCheck size={13} /> Verify file</>}
          </Button>
        </div>

        {status === 'original' && (
          <div style={{ marginTop: 14, background: 'rgba(104,211,145,0.08)', border: '0.5px solid rgba(104,211,145,0.3)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#68d391', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              <ShieldCheck size={18} /> ORIGINAL — Signature Verified
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>
              The RSA signature check passed. The file's cryptographic hash matches. It has not been tampered with.
            </p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748b', lineHeight: 1.8 }}>
              <div><span style={{ color: '#94a3b8' }}>File: </span>{details.fileName}</div>
              <div><span style={{ color: '#94a3b8' }}>Size: </span>{details.fileSize} KB</div>
              <div><span style={{ color: '#94a3b8' }}>SHA-256: </span>{details.hashHex}</div>
              <div><span style={{ color: '#94a3b8' }}>Sig preview: </span>{details.sigHex}</div>
            </div>
          </div>
        )}

        {status === 'tampered' && (
          <div style={{ marginTop: 14, background: 'rgba(252,129,129,0.08)', border: '0.5px solid rgba(252,129,129,0.3)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fc8181', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              <ShieldX size={18} /> DUPLICATE / TAMPERED — Verification Failed
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>The RSA signature could not be verified. This file may be a duplicate or has been modified.</p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748b', marginTop: 8 }}>
              <div><span style={{ color: '#94a3b8' }}>SHA-256: </span>{details.hashHex}</div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginTop: 14, background: 'rgba(252,129,129,0.08)', border: '0.5px solid rgba(252,129,129,0.3)', borderRadius: 10, padding: '12px 16px', color: '#fc8181', fontSize: 13 }}>
            Error: {details.error}
          </div>
        )}
      </Card>

      <KeyPanel
        publicKeyPEM={publicKeyPEM}
        privateKeyPEM={privateKeyPEM}
        loading={keysLoading}
        regenerate={regenerate}
      />
    </div>
  )
}
