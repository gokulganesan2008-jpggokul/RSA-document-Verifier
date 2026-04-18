// utils/rsaCrypto.js — RSA cryptography utilities using WebCrypto API

export async function generateRSAKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  )
}

export async function exportPublicKeyPEM(publicKey) {
  const exported = await crypto.subtle.exportKey('spki', publicKey)
  return `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64(exported)}\n-----END PUBLIC KEY-----`
}

export async function exportPrivateKeyPEM(privateKey) {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey)
  return `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64(exported)}\n-----END PRIVATE KEY-----`
}

export async function importPublicKeyPEM(pem) {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return crypto.subtle.importKey(
    'spki', bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true, ['verify']
  )
}

export async function importPrivateKeyPEM(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return crypto.subtle.importKey(
    'pkcs8', bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true, ['sign']
  )
}

export async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  return crypto.subtle.digest('SHA-256', buffer)
}

export async function signFile(file, privateKey) {
  const hashBuffer = await hashFile(file)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, hashBuffer)
  return { hashBuffer, signature }
}

export async function verifySignature(hashBuffer, signature, publicKey) {
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, hashBuffer)
}

export async function verifySignatureFromB64(hashBuffer, sigB64, publicKeyPEM) {
  const publicKey = await importPublicKeyPEM(publicKeyPEM)
  const sigBinary = atob(sigB64.replace(/\n/g, ''))
  const sigBuffer = new Uint8Array(sigBinary.length)
  for (let i = 0; i < sigBinary.length; i++) sigBuffer[i] = sigBinary.charCodeAt(i)
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, sigBuffer.buffer, hashBuffer)
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)
  return b64.match(/.{1,64}/g).join('\n')
}

export function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function arrayBufferToNumeric(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString().padStart(3, '0')).join('-')
}

export function signatureToBase64(signature) { return arrayBufferToBase64(signature) }

export function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function getFileBaseName(filename) { return filename.replace(/\.[^.]+$/, '') }

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password + ':rsa-verifier-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
