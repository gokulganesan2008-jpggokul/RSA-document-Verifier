// modules/QRModule.jsx
import React, { useState, useEffect, useRef } from 'react'
import { QrCode, Download, Loader, AlertCircle } from 'lucide-react'
import Card from '../components/Card'
import DropZone from '../components/DropZone'
import Button from '../components/Button'
import SectionLabel from '../components/SectionLabel'
import { signFile, arrayBufferToHex, downloadTextFile, getFileBaseName } from '../utils/rsaCrypto'

export default function QRModule({ keyPair, loading: keysLoading }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [askQR, setAskQR] = useState(false)
  const [wantQR, setWantQR] = useState(null)
  const canvasRef = useRef(null)
  const qrRef = useRef(null)

  const handleFile = (f) => { setFile(f); setStatus(null); setResult(null); setAskQR(false); setWantQR(null) }

  const generate = async () => {
    if (!file || !keyPair) return
    setStatus('loading')
    setAskQR(false)
    try {
      await new Promise(r => setTimeout(r, 600))
      const { hashBuffer, signature } = await signFile(file, keyPair.privateKey)
      const hashHex = arrayBufferToHex(hashBuffer)
      const sigArr = new Uint8Array(signature)
      const sigHex = Array.from(sigArr.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')
      const qrData = `RSA-SIG:${sigHex}|FILE:${file.name}|HASH:${hashHex.slice(0, 32)}|TS:${Date.now()}`
      setResult({ hashHex, sigHex, qrData, fileName: file.name, fileSize: (file.size / 1024).toFixed(2) })
      setStatus('signed')
      setAskQR(true)
    } catch (e) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  useEffect(() => {
    if (wantQR === true && result && canvasRef.current) {
      canvasRef.current.innerHTML = ''
      import('qrcode').then(QRCode => {
        QRCode.default.toCanvas(document.createElement('canvas'), result.qrData, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err, canvas) => {
          if (!err && canvasRef.current) {
            canvasRef.current.innerHTML = ''
            canvas.style.borderRadius = '8px'
            canvasRef.current.appendChild(canvas)
            qrRef.current = canvas
          }
        })
      })
      setStatus('done')
    }
  }, [wantQR, result])

  const downloadQR = () => {
    if (!qrRef.current) return
    const a = document.createElement('a')
    a.href = qrRef.current.toDataURL('image/png')
    a.download = getFileBaseName(result.fileName) + '-qr-signature.png'
    a.click()
  }

  const downloadData = () => {
    if (!result) return
    const content = `QR DIGITAL SIGNATURE DATA
==========================
File: ${result.fileName}
Size: ${result.fileSize} KB
Algorithm: RSASSA-PKCS1-v1_5 / SHA-256
Generated: ${new Date().toISOString()}

QR Code Content:
${result.qrData}

Full SHA-256 Hash:
${result.hashHex}

Signature Preview (hex, first 32 bytes):
${result.sigHex}

Place the QR code at the bottom-right corner of your document or certificate.
Scanning the QR code will reveal the file's RSA signature hash for verification.
`
    downloadTextFile(content, getFileBaseName(result.fileName) + '-qr-data.txt')
  }

  return (
    <div>
      <Card>
        <SectionLabel>QR code generator for digital signatures</SectionLabel>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
          Works with all file types. Generates a QR code that encodes your RSA signature hash — scan it to verify the document's authenticity. The QR code can be placed at the bottom-right of any document or certificate.
        </p>
        <DropZone file={file} onFile={handleFile} accept="*" label="All file types supported — images, PDFs, Word docs, and more" />
        <div style={{ marginTop: 14 }}>
          <Button onClick={generate} disabled={!file || keysLoading || status === 'loading'}>
            {status === 'loading' ? <><Loader size={13} /> Processing…</> : <><QrCode size={13} /> Sign & generate QR</>}
          </Button>
        </div>

        {/* Ask about QR */}
        {askQR && wantQR === null && (
          <div style={{ marginTop: 14, background: 'rgba(99,179,237,0.06)', border: '0.5px solid rgba(99,179,237,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#63b3ed', fontWeight: 500, marginBottom: 10 }}>
              <QrCode size={15} /> Do you want to add a QR code to your verification?
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
              File signed successfully. You can optionally generate a QR code that encodes the RSA signature hash for easy verification.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setWantQR(true)}>
                <QrCode size={13} /> Yes, generate QR code
              </Button>
              <Button variant="ghost" onClick={() => { setWantQR(false); setStatus('skipped') }}>
                No, skip QR code
              </Button>
            </div>
          </div>
        )}

        {/* QR output */}
        {wantQR === true && (
          <div style={{ marginTop: 14, background: 'rgba(99,179,237,0.06)', border: '0.5px solid rgba(99,179,237,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#63b3ed', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              <QrCode size={15} /> QR code generated
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div ref={canvasRef} style={{ background: '#fff', padding: 10, borderRadius: 10, border: '0.5px solid rgba(99,179,237,0.2)', minWidth: 220, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={20} color="#64748b" />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>QR encodes:</p>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748b', wordBreak: 'break-all', background: '#0f1628', padding: '8px 10px', borderRadius: 8, border: '0.5px solid rgba(99,179,237,0.1)', marginBottom: 10, lineHeight: 1.6 }}>
                  {result?.qrData}
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
                  Place this QR at the <strong style={{ color: '#94a3b8' }}>bottom-right</strong> of your document or certificate. Scanning it reveals the RSA signature hash for verification.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="success" onClick={downloadQR}>
                    <Download size={13} /> Download QR (PNG)
                  </Button>
                  <Button variant="ghost" onClick={downloadData}>
                    <Download size={13} /> Download data (.txt)
                  </Button>
                </div>
              </div>
            </div>

            {result && (
              <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748b', lineHeight: 1.7 }}>
                <div><span style={{ color: '#94a3b8' }}>File: </span>{result.fileName} ({result.fileSize} KB)</div>
                <div><span style={{ color: '#94a3b8' }}>SHA-256: </span>{result.hashHex}</div>
              </div>
            )}
          </div>
        )}

        {wantQR === false && status === 'skipped' && (
          <div style={{ marginTop: 12, background: 'rgba(99,179,237,0.06)', border: '0.5px solid rgba(99,179,237,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
            QR code skipped. File was signed successfully.
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginTop: 12, background: 'rgba(252,129,129,0.08)', border: '0.5px solid rgba(252,129,129,0.3)', borderRadius: 10, padding: '12px 16px', color: '#fc8181', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={14} /> Error: {result?.error}
          </div>
        )}
      </Card>
    </div>
  )
}
