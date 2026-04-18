// utils/useRSAKeys.js — React hook to manage RSA key pair lifecycle
import { useState, useEffect } from 'react'
import { generateRSAKeyPair, exportPublicKeyPEM, exportPrivateKeyPEM } from './rsaCrypto'

export function useRSAKeys() {
  const [keyPair, setKeyPair] = useState(null)
  const [publicKeyPEM, setPublicKeyPEM] = useState('')
  const [privateKeyPEM, setPrivateKeyPEM] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const kp = await generateRSAKeyPair()
      const pub = await exportPublicKeyPEM(kp.publicKey)
      const priv = await exportPrivateKeyPEM(kp.privateKey)
      setKeyPair(kp)
      setPublicKeyPEM(pub)
      setPrivateKeyPEM(priv)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { generate() }, [])

  return { keyPair, publicKeyPEM, privateKeyPEM, loading, error, regenerate: generate }
}
