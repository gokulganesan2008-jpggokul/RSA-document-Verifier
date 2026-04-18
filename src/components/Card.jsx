// components/Card.jsx
import React from 'react'

export default function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#1a2240',
      border: '0.5px solid rgba(99,179,237,0.15)',
      borderRadius: 16,
      padding: '1.25rem',
      marginBottom: '1rem',
      ...style
    }}>
      {children}
    </div>
  )
}
