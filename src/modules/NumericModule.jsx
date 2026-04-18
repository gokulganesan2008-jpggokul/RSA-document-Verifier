// modules/NumericModule.jsx
import React, { useState } from 'react'
import { Hash, Download, Loader, Copy } from 'lucide-react'
import Card from '../components/Card'
import DropZone from '../components/DropZone'
import Button from '../components/Button'
import SectionLabel from '../components/SectionLabel'
import { signFile, arrayBufferToHex, arrayBufferToNumeric, downloadTextFile, getFileBaseName } from '../utils/rsaCrypto'

export default function NumericModule({ keyPair, loading: keysLoading }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleFile = (f) => { setFile(f); setStatus(null); setResult(null) }

  const generate = async () => {
    if (!file || !keyPair) return
    setStatus('loading')
    try {
      await new Promise(r => setTimeout(r, 600))
      const { hashBuffer, signature } = await signFile(file, keyPair.privateKey)
      const hashHex = arrayBufferToHex(hashBuffer)
      const numericSig = arrayBufferToNumeric(signature)
      const hashDecimal = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString()).join('-')
      setResult({ hashHex, numericSig, hashDecimal, fileName: file.name, fileSize: (file.size / 1024).toFixed(2) })
      setStatus('done')
    } catch (e) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  const download = () => {
    if (!result) return
    const content = `NUMERIC DIGITAL SIGNATURE (RSA)
================================
File: ${result.fileName}
Size: ${result.fileSize} KB
Algorithm: RSASSA-PKCS1-v1_5 / SHA-256
Generated: ${new Date().toISOString()}

SHA-256 Hash (hex):
${result.hashHex}

SHA-256 Hash (decimal byte sequence):
${result.hashDecimal}

RSA Signature (decimal byte sequence):
${result.numericSig}
`
    downloadTextFile(content, getFileBaseName(result.fileName) + '-numeric-signature.txt')
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.numericSig)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div>
      <Card>
        <SectionLabel>Generate numeric digital signature</SectionLabel>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
          Produces a decimal numeric representation of your RSA signature. Each byte of the signature is encoded as a 3-digit decimal number separated by dashes — ideal for certificates, formal documents, and audit logs.
        </p>
        <DropZone file={file} onFile={handleFile} accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.txt,.csv" label="Images, PDFs, Word documents" />
        <div style={{ marginTop: 14 }}>
          <Button onClick={generate} disabled={!file || keysLoading || status === 'loading'}>
            {status === 'loading' ? <><Loader size={13} /> Generating…</> : <><Hash size={13} /> Generate numeric signature</>}
          </Button>
        </div>

        {status === 'done' && result && (
          <div style={{ marginTop: 14, background: 'rgba(246,173,85,0.06)', border: '0.5px solid rgba(246,173,85,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#f6ad55', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={15} /> Numeric signature generated
              </span>
              <span style={{ fontSize: 11, background: 'rgba(246,173,85,0.15)', color: '#f6ad55', padding: '2px 8px', borderRadius: 20 }}>Decimal / RSA-PKCS1-v1_5</span>
            </div>

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748b', marginBottom: 8, lineHeight: 1.7 }}>
              <div><span style={{ color: '#94a3b8' }}>File: </span>{result.fileName} ({result.fileSize} KB)</div>
              <div><span style={{ color: '#94a3b8' }}>SHA-256 (hex): </span>{result.hashHex}</div>
            </div>

            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Numeric signature (decimal byte sequence):</p>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              background: '#0f1628',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#f6ad55',
              wordBreak: 'break-all',
              maxHeight: 110,
              overflowY: 'auto',
              lineHeight: 1.7,
              border: '0.5px solid rgba(246,173,85,0.15)',
            }}>
              {result.numericSig}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button variant="success" onClick={download}>
                <Download size={13} /> Download (.txt)
              </Button>
              <Button variant="ghost" onClick={copy}>
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy numeric sig'}
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginTop: 12, background: 'rgba(252,129,129,0.08)', border: '0.5px solid rgba(252,129,129,0.3)', borderRadius: 10, padding: '12px 16px', color: '#fc8181', fontSize: 13 }}>
            Error: {result?.error}
          </div>
        )}
      </Card>
    </div>
  )
}
