// pages/SignerPage.jsx
import React, { useState, useRef } from 'react'
import { Upload, X, File, FilePen, Download, Copy, Loader, QrCode, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbAddFileRecord, dbGetFilesByHash, dbAddAuditLog } from '../db/idb'
import {
  signFile, arrayBufferToBase64, arrayBufferToHex,
  arrayBufferToNumeric, downloadTextFile, getFileBaseName
} from '../utils/rsaCrypto'

function DropZone({ file, onFile }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)
  return (
    <>
      <div className={`dropzone${drag ? ' drag' : ''}`}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]) }}>
        <div className="dropzone-icon"><Upload size={20} /></div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>Drop file here or click to browse</p>
        <p style={{ fontSize: 12, color: '#64748b' }}>Images, PDFs, Word documents, and any file type</p>
        <input ref={ref} type="file" accept="*" onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
      </div>
      {file && (
        <div className="file-pill">
          <File size={14} color="#63b3ed" />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          <span style={{ color: '#64748b', fontSize: 11, flexShrink: 0 }}>{(file.size / 1024).toFixed(1)} KB</span>
          <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', marginLeft: 8 }}
            onClick={() => onFile(null)}><X size={14} /></button>
        </div>
      )}
    </>
  )
}

export default function SignerPage() {
  const { user, keyPair, publicKeyPEM, keysLoading } = useAuth()
  const [file, setFile]       = useState(null)
  const [status, setStatus]   = useState(null) // null | loading | done | duplicate | error
  const [result, setResult]   = useState(null)
  const [sigType, setSigType] = useState('base64') // base64 | numeric
  const [copied, setCopied]   = useState(false)
  const canvasRef             = useRef(null)
  const qrRef                 = useRef(null)

  const handleFile = f => { setFile(f); setStatus(null); setResult(null) }

  const sign = async () => {
    if (!file || !keyPair || !user) return
    setStatus('loading')
    try {
      await new Promise(r => setTimeout(r, 400))
      const { hashBuffer, signature } = await signFile(file, keyPair.privateKey)
      const hashHex   = arrayBufferToHex(hashBuffer)
      const sigB64    = arrayBufferToBase64(signature)
      const sigNum    = arrayBufferToNumeric(signature)
      const verificationId = crypto.randomUUID()

      // Check for duplicate
      const existing = await dbGetFilesByHash(hashHex)
      if (existing.length > 0) {
        setResult({ hashHex, sigB64, sigNum, verificationId: existing[0].verificationId, duplicate: existing[0] })
        setStatus('duplicate')
        return
      }

      // Store to registry
      const record = {
        userId: user.id, username: user.username,
        fileName: file.name, fileSize: file.size, fileType: file.type,
        hashHex, signatureB64: sigB64, publicKeyPEM,
        verificationId, signedAt: Date.now(),
      }
      await dbAddFileRecord(record)
      await dbAddAuditLog({ userId: user.id, username: user.username, action: 'sign', fileName: file.name, verificationId, details: { hashHex: hashHex.slice(0, 16) + '…' } })

      const portalUrl = `${window.location.origin}/portal/${verificationId}`
      setResult({ hashHex, sigB64, sigNum, verificationId, portalUrl })
      setStatus('done')

      // Generate QR
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.innerHTML = ''
          import('qrcode').then(QRCode => {
            QRCode.default.toCanvas(document.createElement('canvas'), portalUrl,
              { width: 180, margin: 1, color: { dark: '#000', light: '#fff' } },
              (err, canvas) => {
                if (!err && canvasRef.current) {
                  canvasRef.current.innerHTML = ''
                  canvas.style.borderRadius = '8px'
                  canvasRef.current.appendChild(canvas)
                  qrRef.current = canvas
                }
              })
          })
        }
      }, 100)
    } catch (e) {
      setResult({ error: e.message }); setStatus('error')
    }
  }

  const download = (format = 'certificate') => {
    if (!result) return
    const now          = new Date()
    const dateStr      = now.toLocaleString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })
    const isoDate      = now.toISOString()
    const baseName     = getFileBaseName(file.name)
    const fileSizeKB   = (file.size / 1024).toFixed(2)
    const fileSizeMB   = (file.size / 1024 / 1024).toFixed(4)
    const sigLabel     = sigType === 'numeric' ? 'Numeric (Decimal Byte Sequence)' : 'Base64 (PEM-style)'
    const sigContent   = sigType === 'numeric'
      ? result.sigNum
      : `-----BEGIN DIGITAL SIGNATURE-----\n${result.sigB64}\n-----END DIGITAL SIGNATURE-----`

    if (format === 'certificate') {
      // ── Full Certificate Format ──────────────────────────────────────────────
      const content = [
        `╔══════════════════════════════════════════════════════════════════════╗`,
        `║          RSA DIGITAL SIGNATURE CERTIFICATE                          ║`,
        `║          Issued by RSA Document Verifier System                     ║`,
        `╚══════════════════════════════════════════════════════════════════════╝`,
        ``,
        `  CERTIFICATE DETAILS`,
        `  ─────────────────────────────────────────────────────────────────────`,
        `  Signed By        : ${user.username}`,
        `  Date & Time      : ${dateStr}`,
        `  ISO Timestamp    : ${isoDate}`,
        `  Verification ID  : ${result.verificationId}`,
        `  Portal URL       : ${result.portalUrl}`,
        ``,
        `  FILE INFORMATION`,
        `  ─────────────────────────────────────────────────────────────────────`,
        `  File Name        : ${file.name}`,
        `  File Size        : ${fileSizeKB} KB  (${fileSizeMB} MB)`,
        `  File Type        : ${file.type || 'Unknown'}`,
        ``,
        `  CRYPTOGRAPHIC DETAILS`,
        `  ─────────────────────────────────────────────────────────────────────`,
        `  Algorithm        : RSASSA-PKCS1-v1_5`,
        `  Hash Algorithm   : SHA-256`,
        `  Key Size         : 2048-bit RSA`,
        `  Signature Format : ${sigLabel}`,
        ``,
        `  SHA-256 HASH OF FILE`,
        `  ─────────────────────────────────────────────────────────────────────`,
        `  ${result.hashHex}`,
        ``,
        `  RSA DIGITAL SIGNATURE`,
        `  ─────────────────────────────────────────────────────────────────────`,
        sigContent.split('\n').map(l => `  ${l}`).join('\n'),
        ``,
        `  SIGNER'S PUBLIC KEY (PEM)`,
        `  ─────────────────────────────────────────────────────────────────────`,
        publicKeyPEM.split('\n').map(l => `  ${l}`).join('\n'),
        ``,
        `  HOW TO VERIFY`,
        `  ─────────────────────────────────────────────────────────────────────`,
        `  1. Visit the Portal URL above  OR  scan the QR code.`,
        `  2. Re-upload the original file to the portal.`,
        `  3. The system will re-compute the SHA-256 hash and verify the RSA`,
        `     signature against the stored public key automatically.`,
        `  4. A green "ORIGINAL — Verified" result confirms authenticity.`,
        ``,
        `  ─────────────────────────────────────────────────────────────────────`,
        `  This certificate was generated entirely client-side using the`,
        `  WebCrypto API (RSASSA-PKCS1-v1_5 / SHA-256). No files or keys were`,
        `  uploaded to any server. Verification is purely cryptographic.`,
        `  ─────────────────────────────────────────────────────────────────────`,
      ].join('\n')
      downloadTextFile(content, `${baseName}_RSA_Certificate.txt`)

    } else if (format === 'sig') {
      // ── Bare .sig / signature-only file ─────────────────────────────────────
      const content = sigContent
      downloadTextFile(content, `${baseName}.sig`)

    } else if (format === 'json') {
      // ── JSON metadata format ─────────────────────────────────────────────────
      const obj = {
        rsaVerifier: {
          version: '2.0',
          generatedAt: isoDate,
          signedBy: user.username,
          verificationId: result.verificationId,
          portalUrl: result.portalUrl,
        },
        file: {
          name: file.name,
          sizeBytes: file.size,
          type: file.type || null,
        },
        cryptography: {
          algorithm: 'RSASSA-PKCS1-v1_5',
          hashAlgorithm: 'SHA-256',
          keySize: 2048,
          sha256Hash: result.hashHex,
          signatureFormat: sigLabel,
          signatureBase64: sigType === 'base64' ? result.sigB64.replace(/\n/g, '') : null,
          signatureNumeric: sigType === 'numeric' ? result.sigNum : null,
          publicKeyPEM: publicKeyPEM,
        },
      }
      downloadTextFile(JSON.stringify(obj, null, 2), `${baseName}_signature.json`)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(sigType === 'numeric' ? result.sigNum : `-----BEGIN DIGITAL SIGNATURE-----\n${result.sigB64}\n-----END DIGITAL SIGNATURE-----`)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const downloadQR = () => {
    if (!qrRef.current) return
    const a = document.createElement('a')
    a.href = qrRef.current.toDataURL('image/png')
    a.download = getFileBaseName(file.name) + '-verification-qr.png'; a.click()
  }

  const isDisabled = !file || keysLoading || status === 'loading'

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Sign File</h1>
        <p className="page-subtitle">Generate an RSA digital signature and register the file for public verification</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Upload + actions */}
        <div>
          <div className="card">
            <p className="section-label">Upload file to sign</p>
            <DropZone file={file} onFile={handleFile} />

            {/* Signature type */}
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Output format</p>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button className={`tab ${sigType === 'base64' ? 'active' : ''}`} onClick={() => setSigType('base64')}>Base64</button>
                <button className={`tab ${sigType === 'numeric' ? 'active' : ''}`} onClick={() => setSigType('numeric')}>Numeric</button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={sign} disabled={isDisabled}
                style={{ width: '100%', justifyContent: 'center', padding: '.65rem' }}>
                {status === 'loading'
                  ? <><Loader size={14} className="spin" /> Signing & registering…</>
                  : <><FilePen size={14} /> Sign & Register File</>}
              </button>
            </div>

            {keysLoading && (
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                <Loader size={11} className="spin" style={{ display: 'inline' }} /> Waiting for RSA keys…
              </p>
            )}
          </div>

          {/* How it works */}
          <div className="card" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
            <p className="section-label">How it works</p>
            <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>File is hashed with <strong style={{ color: '#94a3b8' }}>SHA-256</strong></li>
              <li>Hash is signed with your <strong style={{ color: '#94a3b8' }}>RSA private key</strong></li>
              <li>Record is saved to the <strong style={{ color: '#94a3b8' }}>local file registry</strong></li>
              <li>A <strong style={{ color: '#94a3b8' }}>unique verification ID</strong> + QR code is generated</li>
              <li>Anyone can verify the file via the <strong style={{ color: '#94a3b8' }}>Public Portal</strong></li>
            </ol>
          </div>
        </div>

        {/* Right: Results */}
        <div>
          {status === 'duplicate' && result && (
            <div className="alert alert-amber fade-in" style={{ marginBottom: '1rem' }}>
              <div className="alert-title"><CheckCircle size={16} /> File Already Registered</div>
              <p style={{ color: '#94a3b8', marginBottom: 10 }}>This exact file is already in the registry.</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Previously signed by: <strong style={{ color: '#94a3b8' }}>{result.duplicate.username}</strong></p>
              <div className="vid-chip" style={{ marginTop: 10 }}>
                🆔 {result.duplicate.verificationId}
              </div>
            </div>
          )}

          {status === 'done' && result && (
            <div className="fade-in">
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <div className="alert-title"><CheckCircle size={16} /> File Signed & Registered</div>
                <p style={{ color: '#94a3b8', marginBottom: 10, fontSize: 12 }}>
                  File registered in the public registry. Use the ID or QR code to verify.
                </p>
                <div className="mono-box" style={{ marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8' }}>SHA-256: </span>{result.hashHex}
                </div>
                <div className="vid-chip" style={{ marginBottom: 10 }}>🆔 {result.verificationId}</div>
                <div style={{ fontSize: 11, marginBottom: 12 }}>
                  <span style={{ color: '#64748b' }}>Portal: </span>
                  <a href={result.portalUrl} target="_blank" rel="noreferrer"
                    style={{ color: '#63b3ed', wordBreak: 'break-all' }}>{result.portalUrl}</a>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn-success btn-sm" onClick={() => download('certificate')}>
                    <Download size={12} /> Certificate (.txt)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => download('sig')}>
                    <Download size={12} /> Signature (.sig)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => download('json')}>
                    <Download size={12} /> Metadata (.json)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={copy}>
                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy Sig'}
                  </button>
                  {qrRef.current && (
                    <button className="btn btn-ghost btn-sm" onClick={downloadQR}>
                      <QrCode size={12} /> Download QR
                    </button>
                  )}
                </div>
              </div>

              {/* Signature preview */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p className="section-label" style={{ marginBottom: 0 }}>
                    {sigType === 'numeric' ? 'Numeric Signature' : 'Base64 Signature'}
                  </p>
                  <span className="badge badge-blue">RSA-PKCS1-v1_5 / SHA-256</span>
                </div>
                <div className="mono-box" style={{ fontSize: 10, color: sigType === 'numeric' ? '#f6ad55' : '#63b3ed' }}>
                  {sigType === 'numeric' ? result.sigNum : `-----BEGIN DIGITAL SIGNATURE-----\n${result.sigB64}\n-----END DIGITAL SIGNATURE-----`}
                </div>
              </div>

              {/* QR Code */}
              <div className="card">
                <p className="section-label">Verification QR Code</p>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div ref={canvasRef} style={{
                    background: '#fff', padding: 8, borderRadius: 10,
                    border: '1px solid rgba(99,179,237,.2)', minWidth: 196, minHeight: 196,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Loader size={18} color="#94a3b8" className="spin" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.6 }}>
                      Scan to verify this document's authenticity. The QR links directly to the public verification portal.
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
                      Place this QR at the <strong style={{ color: '#94a3b8' }}>bottom-right</strong> of your document for easy verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="alert alert-error fade-in">
              <div className="alert-title">Error</div>
              <p style={{ color: '#94a3b8' }}>{result?.error}</p>
            </div>
          )}

          {!status && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#64748b' }}>
              <FilePen size={32} style={{ margin: '0 auto 12px', opacity: .4, display: 'block' }} />
              <p style={{ fontSize: 13 }}>Upload a file and click <strong style={{ color: '#94a3b8' }}>Sign & Register</strong> to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
