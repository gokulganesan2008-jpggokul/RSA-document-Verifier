# RSA Document Verifier

A **client-side cryptographic file authentication system** built with React + Vite, using the Web Crypto API for RSA digital signatures and SHA-256 hashing.

## 🔐 Features

| Feature | Description |
|---|---|
| **User Accounts** | Register & login with password-hashed accounts stored in IndexedDB |
| **RSA Key Management** | Auto-generated 2048-bit RSA key pairs per user, persisted locally |
| **File Signing** | Sign any file with RSA private key + SHA-256 hash |
| **Digital Signatures** | Download as Certificate (.txt), Signature (.sig), or JSON |
| **QR Code Generation** | Generates a verification QR code linking to the public portal |
| **Public Verification Portal** | Anyone can verify a file by ID or re-upload — no login needed |
| **File Registry** | All signed files stored in IndexedDB with unique Verification IDs |
| **Audit Trail** | Full log of sign/verify events with CSV export |
| **3-Mode Verification** | Verify by file re-upload, by Verification ID, or by public key paste |
| **Duplicate Detection** | Detects if a file was previously registered |

## 🏗️ Architecture

```
Upload File
   ↓
SHA-256 Hash
   ↓
Check Registry (duplicate?)
   ↓
Sign with RSA Private Key (RSASSA-PKCS1-v1_5)
   ↓
Store to IndexedDB (hash + signature + verification ID)
   ↓
Generate QR Code (links to /portal/{verificationId})
   ↓
Download Certificate / Signature / JSON
```

## 🛠️ Tech Stack

- **React 18** + **Vite 5**
- **React Router v6** — client-side routing
- **Web Crypto API** — RSASSA-PKCS1-v1_5 / SHA-256 / 2048-bit RSA
- **IndexedDB** — persistent local storage (no server)
- **qrcode** — QR code generation
- **lucide-react** — icons

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── contexts/
│   └── AuthContext.jsx      # User auth + RSA key lifecycle
├── db/
│   └── idb.js               # IndexedDB: users, keys, file registry, audit logs
├── pages/
│   ├── LoginPage.jsx         # Login / Register
│   ├── DashboardPage.jsx     # Stats + recent activity
│   ├── SignerPage.jsx        # Sign file + generate QR
│   ├── VerifyPage.jsx        # 3-mode file verification
│   ├── PortalPage.jsx        # Public verification portal
│   ├── AuditPage.jsx         # Audit trail + CSV export
│   └── KeysPage.jsx          # RSA key management
├── components/
│   └── Sidebar.jsx           # Navigation sidebar
└── utils/
    └── rsaCrypto.js          # WebCrypto helpers (sign, verify, import/export PEM)
```

## 🔒 Privacy & Security

- **100% client-side** — no files, keys, or signatures are ever uploaded to any server
- RSA keys are stored in the browser's **IndexedDB** only
- Passwords are hashed with **SHA-256** before storage
- All cryptography uses the browser's native **Web Crypto API**

## 📄 License

MIT
