// components/DropZone.jsx
import React, { useRef, useState } from 'react'
import { Upload, X, File } from 'lucide-react'

const styles = {
  zone: {
    border: '1.5px dashed rgba(99,179,237,0.3)',
    borderRadius: 10,
    padding: '2rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    position: 'relative',
  },
  zoneActive: {
    background: 'rgba(99,179,237,0.06)',
    borderColor: 'rgba(99,179,237,0.6)',
  },
  icon: {
    width: 40, height: 40,
    borderRadius: '50%',
    border: '1.5px solid rgba(99,179,237,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px',
    color: '#63b3ed',
  },
  title: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
  sub: { fontSize: 12, color: '#64748b' },
  pill: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    background: 'rgba(99,179,237,0.08)',
    borderRadius: 8,
    border: '0.5px solid rgba(99,179,237,0.2)',
    marginTop: 12,
    fontSize: 13,
  },
  remove: {
    marginLeft: 'auto', background: 'none', border: 'none',
    color: '#64748b', cursor: 'pointer', padding: 2,
    display: 'flex', alignItems: 'center',
  }
}

export default function DropZone({ file, onFile, accept = '*', label = 'Images, PDFs, Word documents' }) {
  const inputRef = useRef()
  const [drag, setDrag] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  const handleChange = (e) => {
    if (e.target.files[0]) onFile(e.target.files[0])
  }

  return (
    <>
      <div
        style={{ ...styles.zone, ...(drag ? styles.zoneActive : {}) }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        <div style={styles.icon}><Upload size={18} /></div>
        <p style={styles.title}>Drop file here or click to browse</p>
        <p style={styles.sub}>{label}</p>
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} />
      </div>

      {file && (
        <div style={styles.pill}>
          <File size={14} color="#63b3ed" />
          <span>{file.name}</span>
          <span style={{ color: '#64748b', fontSize: 11 }}>{(file.size / 1024).toFixed(1)} KB</span>
          <button style={styles.remove} onClick={() => onFile(null)}><X size={14} /></button>
        </div>
      )}
    </>
  )
}
