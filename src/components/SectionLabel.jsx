// components/SectionLabel.jsx
import React from 'react'

export default function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#64748b',
      marginBottom: 10
    }}>
      {children}
    </p>
  )
}
