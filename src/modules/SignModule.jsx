// modules/SignModule.jsx
import React, { useState } from 'react'
import { PenTool, Download, Loader, Copy } from 'lucide-react'
import Card from '../components/Card'
import DropZone from '../components/DropZone'
import Button from '../components/Button'
import SectionLabel from '../components/SectionLabel'
import { signFile, arrayBufferToBase64, arrayBufferToHex, downloadTextFile, getFileBaseName } from '../utils/rsaCrypto'

export default function SignModule({ keyPair, loading: keysLoading }) {
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
      const sigB64 = arrayBufferToBase64(signature)
      setResult({ hashHex, sigB64, fileName: file.name, fileSize: (file.size / 1024).toFixed(2) })
      setStatus('done')
    } catch (e) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  const download = () => {
    if (!result) return
    const content = `-----BEGIN DIGITAL SIGNATURE-----
${result.sigB64}
-----END DIGITAL SIGNATURE-----

File: ${result.fileName}
Algorithm: RSASSA-PKCS1-v1_5 / SHA-256
File size: ${result.fileSize} KB
SHA-256 Hash: ${result.hashHex}
Generated: ${new Date().toISOString()}
`
    downloadTextFile(content, getFileBaseName(result.fileName) + '-signature.txt')
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(`-----BEGIN DIGITAL SIGNATURE-----\n${result.sigB64}\n-----END DIGITAL SIGNATURE-----`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div>
      <Card>
        <SectionLabel>Generate digital signature</SectionLabel>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
          Produces a Base64-encoded RSA digital signature for your file. The signature uniquely identifies the file and can be verified by anyone with your public key.
        </p>
        <DropZone file={file} onFile={handleFile} accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.txt,.csv" label="Images, PDFs, Word documents" />
        <div style={{ marginTop: 14 }}>
          <Button onClick={generate} disabled={!file || keysLoading || status === 'loading'}>
            {status === 'loading' ? <><Loader size={13} /> Signing…</> : <><PenTool size={13} /> Generate signature</>}
          </Button>
        </div>

        {status === 'done' && result && (
          <div style={{ marginTop: 14, background: 'rgba(104,211,145,0.06)', border: '0.5px solid rgba(104,211,145,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#68d391', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <PenTool size={15} /> Signature generated
              </span>
              <span style={{ fontSize: 11, background: 'rgba(104,211,145,0.15)', color: '#68d391', padding: '2px 8px', borderRadius: 20 }}>RSA-PKCS1-v1_5 / SHA-256</span>
            </div>

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748b', marginBottom: 8, lineHeight: 1.7 }}>
              <div><span style={{ color: '#94a3b8' }}>File: </span>{result.fileName} ({result.fileSize} KB)</div>
              <div><span style={{ color: '#94a3b8' }}>SHA-256: </span>{result.hashHex}</div>
            </div>

            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Base64 signature:</p>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              background: '#0f1628',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#64748b',
              wordBreak: 'break-all',
              maxHeight: 110,
              overflowY: 'auto',
              lineHeight: 1.6,
              border: '0.5px solid rgba(99,179,237,0.1)',
            }}>
              -----BEGIN DIGITAL SIGNATURE-----<br />
              {result.sigB64}<br />
              -----END DIGITAL SIGNATURE-----
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button variant="success" onClick={download}>
                <Download size={13} /> Download (.txt)
              </Button>
              <Button variant="ghost" onClick={copy}>
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy signature'}
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
