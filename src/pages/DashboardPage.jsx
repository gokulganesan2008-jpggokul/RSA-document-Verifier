// pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react'
import { FilePen, ShieldCheck, KeyRound, ClipboardList, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dbGetUserStats } from '../db/idb'

function fmtDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  return bytes > 1024 * 1024
    ? (bytes / 1024 / 1024).toFixed(1) + ' MB'
    : (bytes / 1024).toFixed(1) + ' KB'
}

function ActionBadge({ action }) {
  if (action === 'sign')   return <span className="badge badge-blue">Signed</span>
  if (action === 'verify') return <span className="badge badge-green">Verified</span>
  if (action === 'verify-fail') return <span className="badge badge-red">Failed</span>
  return <span className="badge badge-amber">{action}</span>
}

export default function DashboardPage() {
  const { user, publicKeyPEM } = useAuth()
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) dbGetUserStats(user.id).then(setStats)
  }, [user])

  const keyFingerprint = publicKeyPEM
    ? publicKeyPEM.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '').slice(-24)
    : '…'

  const statCards = [
    {
      label: 'Files Signed',
      value: stats?.totalSigned ?? '—',
      icon: FilePen,
      gradient: 'linear-gradient(90deg, #63b3ed, #4299e1)',
      iconBg: 'rgba(99,179,237,.15)',
      iconColor: '#63b3ed',
    },
    {
      label: 'Verifications',
      value: stats?.totalVerified ?? '—',
      icon: ShieldCheck,
      gradient: 'linear-gradient(90deg, #68d391, #48bb78)',
      iconBg: 'rgba(104,211,145,.15)',
      iconColor: '#68d391',
    },
    {
      label: 'RSA Key Pair',
      value: '2048',
      unit: 'bit',
      icon: KeyRound,
      gradient: 'linear-gradient(90deg, #b794f4, #9f7aea)',
      iconBg: 'rgba(183,148,244,.15)',
      iconColor: '#b794f4',
    },
    {
      label: 'Audit Events',
      value: (stats?.recentLogs?.length ?? 0) > 0 ? (stats?.totalVerified + stats?.totalSigned) : '—',
      icon: ClipboardList,
      gradient: 'linear-gradient(90deg, #f6ad55, #ed8936)',
      iconBg: 'rgba(246,173,85,.15)',
      iconColor: '#f6ad55',
    },
  ]

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.username} 👋</h1>
        <p className="page-subtitle">Here's your document authentication overview</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ label, value, unit, icon: Icon, gradient, iconBg, iconColor }) => (
          <div className="stat-card" key={label} style={{ '--accent-gradient': gradient }}>
            <div className="stat-icon" style={{ background: iconBg }}>
              <Icon size={18} color={iconColor} />
            </div>
            <div className="stat-value">
              {value}{unit && <span style={{ fontSize: 14, color: '#64748b', marginLeft: 4 }}>{unit}</span>}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Recent Files */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Recent Signed Files</p>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/sign')}>
              <FilePen size={12} /> Sign New
            </button>
          </div>
          {!stats?.recentFiles?.length ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <FilePen size={28} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 13, color: '#64748b' }}>No files signed yet.<br />Sign your first file to get started.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>File name</th><th>Size</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {stats.recentFiles.map(f => (
                    <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/verify')}>
                      <td style={{ color: '#e2e8f0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.fileName}
                      </td>
                      <td>{fmtSize(f.fileSize)}</td>
                      <td style={{ fontSize: 11 }}>{fmtDate(f.signedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Audit + Key fingerprint */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p className="section-label">Public Key Fingerprint</p>
            <div className="mono-box" style={{ fontSize: 10, color: '#b794f4' }}>
              …{keyFingerprint}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/keys')}>
              <KeyRound size={12} /> Manage Keys
            </button>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p className="section-label" style={{ marginBottom: 0 }}>Recent Audit Events</p>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit')}>
                <ClipboardList size={12} /> View all
              </button>
            </div>
            {!stats?.recentLogs?.length ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>No audit events yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.recentLogs.slice(0, 5).map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <Clock size={11} color="#64748b" />
                    <span style={{ color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.fileName || 'Unknown file'}
                    </span>
                    <ActionBadge action={log.action} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,179,237,.06), rgba(183,148,244,.06))' }}>
        <p className="section-label">Quick Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/sign')}><FilePen size={14} /> Sign a File</button>
          <button className="btn btn-ghost" onClick={() => navigate('/verify')}><ShieldCheck size={14} /> Verify a File</button>
          <button className="btn btn-ghost" onClick={() => navigate('/portal')}><ChevronRight size={14} /> Public Portal</button>
          <button className="btn btn-ghost" onClick={() => navigate('/audit')}><ClipboardList size={14} /> View Audit Trail</button>
        </div>
      </div>
    </div>
  )
}
