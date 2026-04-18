// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  dbCreateUser, dbGetUserByUsername, dbSaveUserKeys, dbGetUserKeys
} from '../db/idb'
import {
  generateRSAKeyPair, exportPublicKeyPEM, exportPrivateKeyPEM,
  importPublicKeyPEM, importPrivateKeyPEM, hashPassword
} from '../utils/rsaCrypto'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [keyPair, setKeyPair]         = useState(null)
  const [publicKeyPEM, setPubPEM]     = useState('')
  const [privateKeyPEM, setPrivPEM]   = useState('')
  const [keysLoading, setKeysLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('rsa-user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      loadKeys(u.id).finally(() => setAuthLoading(false))
    } else {
      setAuthLoading(false)
    }
  }, [])

  const loadKeys = async (userId) => {
    setKeysLoading(true)
    try {
      const rec = await dbGetUserKeys(userId)
      if (rec) {
        setPubPEM(rec.publicKeyPEM)
        setPrivPEM(rec.privateKeyPEM)
        const pub  = await importPublicKeyPEM(rec.publicKeyPEM)
        const priv = await importPrivateKeyPEM(rec.privateKeyPEM)
        setKeyPair({ publicKey: pub, privateKey: priv })
      }
    } finally {
      setKeysLoading(false)
    }
  }

  const register = async (username, password) => {
    const existing = await dbGetUserByUsername(username)
    if (existing) throw new Error('Username already taken')
    const hash = await hashPassword(password)
    const userId = await dbCreateUser(username, hash)
    const kp = await generateRSAKeyPair()
    const pubPEM  = await exportPublicKeyPEM(kp.publicKey)
    const privPEM = await exportPrivateKeyPEM(kp.privateKey)
    await dbSaveUserKeys(userId, pubPEM, privPEM)
    const session = { id: userId, username, createdAt: Date.now() }
    sessionStorage.setItem('rsa-user', JSON.stringify(session))
    setUser(session)
    setKeyPair(kp)
    setPubPEM(pubPEM)
    setPrivPEM(privPEM)
  }

  const login = async (username, password) => {
    const rec = await dbGetUserByUsername(username)
    if (!rec) throw new Error('User not found')
    const hash = await hashPassword(password)
    if (hash !== rec.passwordHash) throw new Error('Incorrect password')
    const session = { id: rec.id, username: rec.username, createdAt: rec.createdAt }
    sessionStorage.setItem('rsa-user', JSON.stringify(session))
    setUser(session)
    await loadKeys(rec.id)
  }

  const logout = () => {
    sessionStorage.removeItem('rsa-user')
    setUser(null); setKeyPair(null); setPubPEM(''); setPrivPEM('')
  }

  const regenerateKeys = async () => {
    if (!user) return
    setKeysLoading(true)
    try {
      const kp = await generateRSAKeyPair()
      const pubPEM  = await exportPublicKeyPEM(kp.publicKey)
      const privPEM = await exportPrivateKeyPEM(kp.privateKey)
      await dbSaveUserKeys(user.id, pubPEM, privPEM)
      setKeyPair(kp); setPubPEM(pubPEM); setPrivPEM(privPEM)
    } finally {
      setKeysLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, keyPair, publicKeyPEM, privateKeyPEM,
      keysLoading, authLoading,
      register, login, logout, regenerateKeys
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
