// components/Button.jsx
import React from 'react'

const variants = {
  primary: {
    background: '#63b3ed',
    color: '#0a0f1e',
    border: 'none',
  },
  success: {
    background: '#68d391',
    color: '#0a0f1e',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '0.5px solid rgba(99,179,237,0.2)',
  },
  danger: {
    background: 'rgba(252,129,129,0.15)',
    color: '#fc8181',
    border: '0.5px solid rgba(252,129,129,0.3)',
  }
}

export default function Button({ children, onClick, variant = 'primary', disabled = false, style = {}, size = 'md' }) {
  const padding = size === 'sm' ? '6px 14px' : '10px 20px'
  const fontSize = size === 'sm' ? 12 : 13

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding,
        fontSize,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...style
      }}
    >
      {children}
    </button>
  )
}
