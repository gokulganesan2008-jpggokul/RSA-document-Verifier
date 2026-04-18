// components/ResultBox.jsx
import React from 'react'
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react'

const configs = {
  success: {
    bg: 'rgba(104,211,145,0.08)',
    border: 'rgba(104,211,145,0.3)',
    color: '#68d391',
    icon: <CheckCircle size={16} />
  },
  error: {
    bg: 'rgba(252,129,129,0.08)',
    border: 'rgba(252,129,129,0.3)',
    color: '#fc8181',
    icon: <XCircle size={16} />
  },
  info: {
    bg: 'rgba(99,179,237,0.06)',
    border: 'rgba(99,179,237,0.2)',
    color: '#63b3ed',
    icon: <Info size={16} />
  },
  warning: {
    bg: 'rgba(246,173,85,0.08)',
    border: 'rgba(246,173,85,0.3)',
    color: '#f6ad55',
    icon: <AlertCircle size={16} />
  }
}

export default function ResultBox({ type = 'info', title, children }) {
  const c = configs[type]
  return (
    <div style={{
      background: c.bg,
      border: `0.5px solid ${c.border}`,
      borderRadius: 10,
      padding: '12px 16px',
      marginTop: 12,
      fontSize: 13,
      lineHeight: 1.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.color, fontWeight: 500, marginBottom: 4 }}>
        {c.icon} {title}
      </div>
      {children}
    </div>
  )
}
