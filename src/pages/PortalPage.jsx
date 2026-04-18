// pages/PortalPage.jsx  — Public verification portal (no login required)
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Shield, Search, Upload, ShieldCheck, ShieldX, X, File, Loader, Globe } from 'lucide-react'
import { dbGetFileByVerificationId, dbGetFilesByHash } from '../db/idb'
import { hashFile, arrayBufferToHex, verifySignatureFromB64 } from '../utils/rsaCrypto'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PortalPage() {
  const { id: paramId } = useParams()
  const navigate        = useNavigate()
  const [vid, setVid]   = useState(paramId || '')
  const [tab, setTab]   = useState(paramId ? 'id' : 'file') // id | file
  const fileRef         = useRef()

  // ID lookup state
  const [idRecord, setIdRecord]   = useState(null)
  const [idLoading, setIdLoading] = useState(false)
  const [idSearched, setIdSearched] = useState(false)

  // File re-upload state
  const [file, setFile]         = useState(null)
  const [drag, setDrag]         = useState(false)
  const [fStatus, setFStatus]   = useState(null)
  const [fResult, setFResult]   = useState(null)

  useEffect(() => {
    if (paramId) { setVid(paramId); setTab('id'); lookupById(paramId) }
  }, [paramId])

  const lookupById = async (searchId) => {
    setIdLoading(true); setIdRecord(null); setIdSearched(false)
    try {
      const rec = await dbGetFileByVerificationId((searchId || vid).trim())
      setIdRecord(rec || null)
    } finally { setIdLoading(false); setIdSearched(true) }
  }

  const verifyFile = async () => {
    if (!file) return
    setFStatus('loading'); setFResult(null)
    try {
      await new Promise(r => setTimeout(r, 400))
      const buf  = await hashFile(file)
      const hex  = arrayBufferToHex(buf)
      const recs = await dbGetFilesByHash(hex)
      if (recs.length > 0) {
        const rec = recs[0]
        const isValid = await verifySignatureFromB64(buf, rec.signatureB64, rec.publicKeyPEM)
        setFResult({ ...rec, hashHex: hex, cryptoValid: isValid })
        setFStatus(isValid ? 'original' : 'tampered')
      } else {
        setFResult({ hashHex: hex }); setFStatus('notfound')
      }
    } catch (e) { setFResult({ error: e.message }); setFStatus('error') }
  }

  return (
    <div className="portal-wrap">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 1rem',
          background: 'rgba(99,179,237,.1)', border: '1px solid rgba(99,179,237,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Globe size={26} color="#63b3ed" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Public Verification Portal</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, maxWidth: 480, margin: '8px auto 0' }}>
          Verify any document's authenticity without needing an account. Paste a verification ID or re-upload your file.
        </p>
        <div style={{ marginTop: 12 }}>
          <Link to="/login" style={{ fontSize: 12, color: '#63b3ed' }}>← Sign in to your account</Link>
        </div>
      </div>

      {/* Card */}
      <div className="portal-card">
        <div className="card">
          <div className="tabs">
            <button className={`tab ${tab === 'id' ? 'active' : ''}`} onClick={() => setTab('id')}><Search size={12} style={{ display: 'inline', marginRight: 4 }} />By Verification ID</button>
            <button className={`tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}><Upload size={12} style={{ display: 'inline', marginRight: 4 }} />By File Upload</button>
          </div>

          {/* ── Tab: ID ── */}
          {tab === 'id' && (
            <div>
              <p className="section-label">Verification ID</p>
              <div className="search-bar" style={{ marginBottom: 12 }}>
                <Search size={14} color="#64748b" />
                <input type="text" placeholder="Paste verification ID (UUID)…"
                  value={vid} onChange={e => { setVid(e.target.value); setIdSearched(false); setIdRecord(null) }}
                  onKeyDown={e => e.key === 'Enter' && lookupById()} />
                {vid && <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                  onClick={() => { setVid(''); setIdRecord(null); setIdSearched(false); navigate('/portal') }}>
                  <X size={14} />
                </button>}
              </div>
              <button className="btn btn-primary" onClick={() => lookupById()} disabled={!vid.trim() || idLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '.65rem' }}>
                {idLoading ? <><Loader size={14} className="spin" /> Looking up…</> : <><Search size={14} /> Verify by ID</>}
              </button>

              {idSearched && !idRecord && !idLoading && (
                <div className="alert alert-amber fade-in" style={{ marginTop: 14 }}>
                  <div className="alert-title"><ShieldX size={14} /> Not Found</div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>No record found for this ID. It may belong to a different device's registry.</p>
                </div>
              )}

              {idRecord && (
                <div className="alert alert-success fade-in" style={{ marginTop: 14 }}>
                  <div className="alert-title"><ShieldCheck size={16} /> ✓ Verified — Registry Entry Found</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2.2, marginTop: 10 }}>
                    <div><span style={{ color: '#94a3b8' }}>File name: </span><strong>{idRecord.fileName}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Signed by: </span>{idRecord.username}</div>
                    <div><span style={{ color: '#94a3b8' }}>Signed at: </span>{fmtDate(idRecord.signedAt)}</div>
                    <div><span style={{ color: '#94a3b8' }}>File size: </span>{(idRecord.fileSize / 1024).toFixed(1)} KB</div>
                    <div><span style={{ color: '#94a3b8' }}>Algorithm: </span>RSASSA-PKCS1-v1_5 / SHA-256</div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>SHA-256: </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{idRecord.hashHex?.slice(0,32)}…</span>
                    </div>
                  </div>
                  <div className="vid-chip" style={{ marginTop: 12 }}>🆔 {idRecord.verificationId}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: File ── */}
          {tab === 'file' && (
            <div>
              <p className="section-label">Re-upload file to verify</p>
              <div className={`dropzone${drag ? ' drag' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) { setFile(e.dataTransfer.files[0]); setFStatus(null); setFResult(null) } }}>
                <div className="dropzone-icon"><Upload size={18} /></div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>Drop file here or click to browse</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>Any file type supported</p>
                <input ref={fileRef} type="file" onChange={e => { if (e.target.files[0]) { setFile(e.target.files[0]); setFStatus(null); setFResult(null) } }} />
              </div>
              {file && (
                <div className="file-pill">
                  <File size={14} color="#63b3ed" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span style={{ color: '#64748b', fontSize: 11 }}>{(file.size / 1024).toFixed(1)} KB</span>
                  <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: 8, display: 'flex' }}
                    onClick={() => { setFile(null); setFStatus(null); setFResult(null) }}><X size={14} /></button>
                </div>
              )}
              <button className="btn btn-primary" onClick={verifyFile} disabled={!file || fStatus === 'loading'}
                style={{ width: '100%', justifyContent: 'center', padding: '.65rem', marginTop: 12 }}>
                {fStatus === 'loading' ? <><Loader size={14} className="spin" /> Verifying…</> : <><ShieldCheck size={14} /> Verify File</>}
              </button>

              {fStatus === 'original' && fResult && (
                <div className="alert alert-success fade-in" style={{ marginTop: 14 }}>
                  <div className="alert-title"><ShieldCheck size={16} /> ORIGINAL — Cryptographic Verification Passed</div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>RSA signature is valid. File is authentic and has not been tampered with.</p>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 2 }}>
                    <div><span style={{ color: '#94a3b8' }}>Signed by: </span>{fResult.username}</div>
                    <div><span style={{ color: '#94a3b8' }}>Signed at: </span>{fmtDate(fResult.signedAt)}</div>
                  </div>
                  <div className="vid-chip" style={{ marginTop: 10 }}>🆔 {fResult.verificationId}</div>
                </div>
              )}
              {fStatus === 'notfound' && (
                <div className="alert alert-amber fade-in" style={{ marginTop: 14 }}>
                  <div className="alert-title"><ShieldX size={16} /> Not in Registry</div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>This file has no record in the registry on this device.</p>
                </div>
              )}
              {fStatus === 'tampered' && (
                <div className="alert alert-error fade-in" style={{ marginTop: 14 }}>
                  <div className="alert-title"><ShieldX size={16} /> Signature Mismatch — Possible Tampering</div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Hash matched a registry record but RSA verification failed.</p>
                </div>
              )}
              {fStatus === 'error' && (
                <div className="alert alert-error fade-in" style={{ marginTop: 14 }}>
                  <div className="alert-title">Error</div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{fResult?.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#374151', textAlign: 'center', marginTop: 12 }}>
          All verification runs locally in your browser. No files are uploaded to any server. · WebCrypto API · RSASSA-PKCS1-v1_5 / SHA-256
        </p>
      </div>
    </div>
  )
}
