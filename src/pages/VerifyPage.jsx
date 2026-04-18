// pages/VerifyPage.jsx
import React, { useState, useRef } from 'react'
import { ShieldCheck, ShieldX, Loader, Upload, X, File, Search, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbGetFilesByHash, dbGetFileByVerificationId, dbAddAuditLog } from '../db/idb'
import { hashFile, arrayBufferToHex, verifySignatureFromB64 } from '../utils/rsaCrypto'

function DropZone({ file, onFile, label = 'Drop any file here to verify' }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)
  return (
    <>
      <div className={`dropzone${drag ? ' drag' : ''}`}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]) }}>
        <div className="dropzone-icon"><Upload size={18} /></div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
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

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function VerifyPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('file') // file | id | pubkey
  // file tab
  const [file, setFile]     = useState(null)
  const [fStatus, setFStatus] = useState(null)
  const [fResult, setFResult] = useState(null)
  // id tab
  const [vid, setVid]       = useState('')
  const [idResult, setIdResult] = useState(null)
  const [idLoading, setIdLoading] = useState(false)
  // pubkey tab
  const [pkFile, setPkFile] = useState(null)
  const [pkPEM, setPkPEM]   = useState('')
  const [pkSig, setPkSig]   = useState('')
  const [pkStatus, setPkStatus] = useState(null)
  const [pkResult, setPkResult] = useState(null)

  // ── Tab 1: Verify by file re-upload ──────────────────────────────────────
  const verifyByFile = async () => {
    if (!file) return
    setFStatus('loading'); setFResult(null)
    try {
      await new Promise(r => setTimeout(r, 400))
      const buf = await hashFile(file)
      const hex = arrayBufferToHex(buf)
      const matches = await dbGetFilesByHash(hex)
      if (matches.length > 0) {
        const rec = matches[0]
        // cryptographic verify
        const isValid = await verifySignatureFromB64(buf, rec.signatureB64, rec.publicKeyPEM)
        setFResult({ ...rec, hashHex: hex, cryptoValid: isValid })
        setFStatus(isValid ? 'original' : 'tampered')
        await dbAddAuditLog({
          userId: user?.id, username: user?.username,
          action: isValid ? 'verify' : 'verify-fail',
          fileName: file.name, verificationId: rec.verificationId,
          details: { hashHex: hex.slice(0, 16) + '…', cryptoValid: isValid }
        })
      } else {
        setFResult({ hashHex: hex })
        setFStatus('notfound')
        await dbAddAuditLog({ userId: user?.id, username: user?.username, action: 'verify-fail', fileName: file.name, details: { hashHex: hex.slice(0,16)+'…', reason: 'not in registry' } })
      }
    } catch (e) { setFResult({ error: e.message }); setFStatus('error') }
  }

  // ── Tab 2: Verify by ID ───────────────────────────────────────────────────
  const verifyById = async () => {
    if (!vid.trim()) return
    setIdLoading(true); setIdResult(null)
    try {
      const rec = await dbGetFileByVerificationId(vid.trim())
      setIdResult(rec || null)
    } finally { setIdLoading(false) }
  }

  // ── Tab 3: Verify with custom public key ──────────────────────────────────
  const verifyWithPubKey = async () => {
    if (!pkFile || !pkPEM || !pkSig) return
    setPkStatus('loading'); setPkResult(null)
    try {
      await new Promise(r => setTimeout(r, 400))
      const buf = await hashFile(pkFile)
      const hex = arrayBufferToHex(buf)
      const isValid = await verifySignatureFromB64(buf, pkSig.trim(), pkPEM.trim())
      setPkResult({ hashHex: hex, isValid })
      setPkStatus(isValid ? 'valid' : 'invalid')
    } catch (e) { setPkResult({ error: e.message }); setPkStatus('error') }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Verify File</h1>
        <p className="page-subtitle">Three ways to verify a document's authenticity using RSA cryptography</p>
      </div>

      <div className="tabs" style={{ maxWidth: 560 }}>
        <button className={`tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}><Upload size={12} style={{ display: 'inline' }} /> By File Upload</button>
        <button className={`tab ${tab === 'id' ? 'active' : ''}`} onClick={() => setTab('id')}><Search size={12} style={{ display: 'inline' }} /> By Verify ID</button>
        <button className={`tab ${tab === 'pubkey' ? 'active' : ''}`} onClick={() => setTab('pubkey')}><KeyRound size={12} style={{ display: 'inline' }} /> By Public Key</button>
      </div>

      {/* ── TAB 1: By file ── */}
      {tab === 'file' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <p className="section-label">Upload file to check</p>
            <DropZone file={file} onFile={f => { setFile(f); setFStatus(null); setFResult(null) }} />
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={verifyByFile} disabled={!file || fStatus === 'loading'}
                style={{ width: '100%', justifyContent: 'center' }}>
                {fStatus === 'loading'
                  ? <><Loader size={14} className="spin" /> Verifying…</>
                  : <><ShieldCheck size={14} /> Verify File</>}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
              Re-upload the file you want to verify. We compute its SHA-256 hash and check if it's registered in the local registry with a valid RSA signature.
            </p>
          </div>

          <div>
            {fStatus === 'original' && fResult && (
              <div className="alert alert-success fade-in">
                <div className="alert-title"><ShieldCheck size={16} /> ORIGINAL — Verified</div>
                <p style={{ color: '#94a3b8', marginBottom: 10, fontSize: 12 }}>
                  RSA signature is valid. File matches the registered record. Not tampered.
                </p>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 2 }}>
                  <div><span style={{ color: '#94a3b8' }}>File: </span>{fResult.fileName}</div>
                  <div><span style={{ color: '#94a3b8' }}>Signed by: </span>{fResult.username}</div>
                  <div><span style={{ color: '#94a3b8' }}>Signed at: </span>{fmtDate(fResult.signedAt)}</div>
                  <div><span style={{ color: '#94a3b8' }}>SHA-256: </span><span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{fResult.hashHex?.slice(0, 32)}…</span></div>
                </div>
                <div className="vid-chip" style={{ marginTop: 10 }}>🆔 {fResult.verificationId}</div>
              </div>
            )}
            {fStatus === 'tampered' && (
              <div className="alert alert-error fade-in">
                <div className="alert-title"><ShieldX size={16} /> TAMPERED — Signature Mismatch</div>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>Hash matches a registry entry but the RSA signature verification failed. The file may have been modified.</p>
              </div>
            )}
            {fStatus === 'notfound' && (
              <div className="alert alert-amber fade-in">
                <div className="alert-title"><ShieldX size={16} /> NOT IN REGISTRY</div>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>This file has no record in the local registry. It was never signed with this system.</p>
                <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#64748b' }}>SHA-256: {fResult?.hashHex}</p>
              </div>
            )}
            {fStatus === 'error' && (
              <div className="alert alert-error fade-in">
                <div className="alert-title">Error</div>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>{fResult?.error}</p>
              </div>
            )}
            {!fStatus && (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem', color: '#64748b' }}>
                <ShieldCheck size={28} style={{ margin: '0 auto 12px', opacity: .35, display: 'block' }} />
                <p style={{ fontSize: 13 }}>Upload a file to begin verification</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: By verification ID ── */}
      {tab === 'id' && (
        <div style={{ maxWidth: 580 }}>
          <div className="card">
            <p className="section-label">Enter Verification ID</p>
            <div className="search-bar" style={{ marginBottom: 12 }}>
              <Search size={14} color="#64748b" />
              <input type="text" placeholder="Paste verification ID (UUID)…" value={vid}
                onChange={e => { setVid(e.target.value); setIdResult(null) }}
                onKeyDown={e => e.key === 'Enter' && verifyById()} />
            </div>
            <button className="btn btn-primary" onClick={verifyById} disabled={!vid.trim() || idLoading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {idLoading ? <><Loader size={14} className="spin" /> Searching…</> : <><Search size={14} /> Look Up ID</>}
            </button>

            {idResult === null && !idLoading && vid && (
              <div className="alert alert-error" style={{ marginTop: 14, fontSize: 12 }}>
                <div className="alert-title"><ShieldX size={14} /> Not Found</div>
                No record found for this verification ID.
              </div>
            )}

            {idResult && (
              <div className="alert alert-success fade-in" style={{ marginTop: 14 }}>
                <div className="alert-title"><ShieldCheck size={16} /> Registry Entry Found</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2, marginTop: 8 }}>
                  <div><span style={{ color: '#94a3b8' }}>File name: </span>{idResult.fileName}</div>
                  <div><span style={{ color: '#94a3b8' }}>Signed by: </span>{idResult.username}</div>
                  <div><span style={{ color: '#94a3b8' }}>Signed at: </span>{fmtDate(idResult.signedAt)}</div>
                  <div><span style={{ color: '#94a3b8' }}>File size: </span>{(idResult.fileSize / 1024).toFixed(1)} KB</div>
                  <div><span style={{ color: '#94a3b8' }}>SHA-256: </span><span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{idResult.hashHex?.slice(0, 32)}…</span></div>
                </div>
                <div className="vid-chip" style={{ marginTop: 10 }}>🆔 {idResult.verificationId}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: By public key ── */}
      {tab === 'pubkey' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <p className="section-label">File to verify</p>
            <DropZone file={pkFile} onFile={f => { setPkFile(f); setPkStatus(null); setPkResult(null) }} />
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Public Key (PEM)</label>
              <textarea className="form-input" rows={4}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                value={pkPEM} onChange={e => setPkPEM(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 10 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Base64 Signature</label>
              <textarea className="form-input" rows={3}
                placeholder="Paste Base64 signature here…"
                value={pkSig} onChange={e => setPkSig(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 10 }} />
            </div>
            <button className="btn btn-primary" onClick={verifyWithPubKey}
              disabled={!pkFile || !pkPEM || !pkSig || pkStatus === 'loading'}
              style={{ width: '100%', justifyContent: 'center' }}>
              {pkStatus === 'loading'
                ? <><Loader size={14} className="spin" /> Verifying…</>
                : <><KeyRound size={14} /> Verify with Public Key</>}
            </button>
          </div>

          <div>
            {pkStatus === 'valid' && (
              <div className="alert alert-success fade-in">
                <div className="alert-title"><ShieldCheck size={16} /> Signature Valid</div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>The RSA signature matches this file using the provided public key.</p>
                <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#64748b' }}>SHA-256: {pkResult?.hashHex?.slice(0,32)}…</p>
              </div>
            )}
            {pkStatus === 'invalid' && (
              <div className="alert alert-error fade-in">
                <div className="alert-title"><ShieldX size={16} /> Signature Invalid</div>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>The signature does not match. File may be tampered or the wrong key was used.</p>
              </div>
            )}
            {pkStatus === 'error' && (
              <div className="alert alert-error fade-in">
                <div className="alert-title">Error</div>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{pkResult?.error}</p>
              </div>
            )}
            {!pkStatus && (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem', color: '#64748b' }}>
                <KeyRound size={28} style={{ margin: '0 auto 12px', opacity: .35, display: 'block' }} />
                <p style={{ fontSize: 13 }}>Upload file, paste a public key and signature to verify manually</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
