// pages/AuditPage.jsx
import React, { useState, useEffect } from 'react'
import { ClipboardList, Download, Search, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbGetUserAuditLogs } from '../db/idb'
import { downloadTextFile } from '../utils/rsaCrypto'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function ActionBadge({ action }) {
  const map = {
    sign:          { cls: 'badge-blue',   label: 'Signed' },
    verify:        { cls: 'badge-green',  label: 'Verified ✓' },
    'verify-fail': { cls: 'badge-red',    label: 'Verify Failed' },
    keygen:        { cls: 'badge-purple', label: 'Key Generated' },
  }
  const { cls, label } = map[action] || { cls: 'badge-amber', label: action }
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function AuditPage() {
  const { user } = useAuth()
  const [logs, setLogs]       = useState([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all') // all | sign | verify | verify-fail
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) dbGetUserAuditLogs(user.id).then(l => { setLogs(l); setLoading(false) })
  }, [user])

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'all' || l.action === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (l.fileName || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.verificationId || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const exportCSV = () => {
    const header = 'Timestamp,Action,File Name,Verification ID,Details\n'
    const rows = filtered.map(l =>
      `"${fmtDate(l.timestamp)}","${l.action}","${l.fileName || ''}","${l.verificationId || ''}","${JSON.stringify(l.details || {})}"`
    ).join('\n')
    downloadTextFile(header + rows, 'audit-log-' + Date.now() + '.csv')
  }

  const stats = {
    signed:   logs.filter(l => l.action === 'sign').length,
    verified: logs.filter(l => l.action === 'verify').length,
    failed:   logs.filter(l => l.action === 'verify-fail').length,
  }

  return (
    <div className="fade-in">
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">Complete log of all sign and verify events for your account</p>
        </div>
        <button className="btn btn-ghost" onClick={exportCSV} disabled={!filtered.length}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'Files Signed',  value: stats.signed,   gradient: 'linear-gradient(90deg,#63b3ed,#4299e1)',   iconBg: 'rgba(99,179,237,.15)',   color: '#63b3ed' },
          { label: 'Verifications', value: stats.verified, gradient: 'linear-gradient(90deg,#68d391,#48bb78)',   iconBg: 'rgba(104,211,145,.15)', color: '#68d391' },
          { label: 'Failed Checks', value: stats.failed,   gradient: 'linear-gradient(90deg,#fc8181,#e53e3e)',   iconBg: 'rgba(252,129,129,.15)', color: '#fc8181' },
        ].map(({ label, value, gradient, iconBg, color }) => (
          <div key={label} className="stat-card" style={{ '--accent-gradient': gradient }}>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={13} color="#64748b" />
          <input type="text" placeholder="Search by file name, action, or ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','All'], ['sign','Signed'], ['verify','Verified'], ['verify-fail','Failed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading audit log…
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">
            <ClipboardList size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: 13 }}>{logs.length ? 'No results match your filter.' : 'No audit events yet. Sign or verify a file to start logging.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>File Name</th>
                  <th>Verification ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id}>
                    <td style={{ color: '#374151', fontSize: 11 }}>{filtered.length - i}</td>
                    <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(log.timestamp)}</td>
                    <td><ActionBadge action={log.action} /></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                      {log.fileName || '—'}
                    </td>
                    <td>
                      {log.verificationId
                        ? <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#b794f4' }}>
                            {log.verificationId.slice(0, 18)}…
                          </span>
                        : <span style={{ color: '#374151' }}>—</span>}
                    </td>
                    <td>
                      {log.details
                        ? <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#64748b' }}>
                            {log.details.hashHex || ''}
                          </span>
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: '#374151', marginTop: 8 }}>
        Showing {filtered.length} of {logs.length} events · All times in local timezone
      </p>
    </div>
  )
}
