// Imports relatifs :
//   ../components/ui.jsx
//   ../hooks/useData.js
//   ../utils/utils.js

import { useState, useMemo }                                      from 'react'
import { Link }                                                   from 'react-router-dom'
import { Plus, Search, FileText, Receipt, ArrowRight }            from 'lucide-react'
import { Badge, Btn, Spinner }                                     from '../components/ui.jsx'
import { useInvoices }                                            from '../hooks/useData.js'
import { formatCurrency, formatDate }                             from '../utils/utils.js'

// ── Status config ─────────────────────────────────────────────

const STATUS_CFG = {
  brouillon: { label: 'Brouillon', bg: '#F5F4F1', text: '#6B6860',  dot: '#C4C2BD' },
  envoye:    { label: 'Envoyé',    bg: '#FFFBEB', text: '#92400E',  dot: '#D97706' },
  paye:      { label: 'Payé',      bg: '#F0FDF4', text: '#166534',  dot: '#16A34A' },
  annule:    { label: 'Annulé',    bg: '#FEF2F2', text: '#991B1B',  dot: '#DC2626' },
}

// Same STATUSES array as original — logic unchanged
const STATUSES = [
  { key: 'brouillon', label: 'Brouillon' },
  { key: 'envoye',    label: 'Envoyé'    },
  { key: 'paye',      label: 'Payé'      },
  { key: 'annule',    label: 'Annulé'    },
]

function StatusPill({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.brouillon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      borderRadius: 99, padding: '3px 10px',
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="animate-pulse" style={{
      display: 'grid', gridTemplateColumns: '130px 1fr 105px 130px 110px 24px',
      gap: 16, padding: '14px 24px', borderBottom: '1px solid #F5F4F1',
    }}>
      {[130, 200, 80, 100, 80, 14].map((w, i) => (
        <div key={i} style={{ height: 12, width: w, background: '#ECEAE4', borderRadius: 6 }} />
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
// All logic identical to uploaded file — only layout/styles changed

export default function Invoices({ type }) {
  const { data: all = [], isLoading } = useInvoices(type)

  // — Same state as original —
  const [q,      setQ]      = useState('')
  const [status, setStatus] = useState(null)

  const isFacture = type === 'facture'
  const base      = isFacture ? '/factures' : '/devis'
  const newPath   = isFacture ? '/factures/nouvelle' : '/devis/nouveau'

  // — Count per status — identical logic —
  const counts = useMemo(() => {
    const m = {}
    STATUSES.forEach(s => { m[s.key] = all.filter(i => i.status === s.key).length })
    return m
  }, [all])

  // — Filtered list — identical logic —
  const filtered = useMemo(() => {
    let r = all
    if (status) r = r.filter(i => i.status === status)
    if (q.trim()) {
      const lq = q.toLowerCase()
      r = r.filter(i =>
        i.number?.toLowerCase().includes(lq) ||
        i.clients?.name?.toLowerCase().includes(lq) ||
        i.clients?.company?.toLowerCase().includes(lq)
      )
    }
    return r
  }, [all, status, q])

  const total = filtered.reduce((s, i) => s + (i.total ?? 0), 0)

  const EmptyIcon = isFacture ? Receipt : FileText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111110', letterSpacing: '-0.02em', margin: 0 }}>
            {isFacture ? 'Factures' : 'Devis'}
          </h1>
          <p style={{ fontSize: 13, color: '#9B9891', marginTop: 5 }}>
            {all.length} document{all.length !== 1 ? 's' : ''}
            {all.length > 0 && ` · ${formatCurrency(all.reduce((s, i) => s + (i.total ?? 0), 0))} au total`}
          </p>
        </div>
        <Link to={newPath}>
          <Btn><Plus size={14} />{isFacture ? 'Nouvelle facture' : 'Nouveau devis'}</Btn>
        </Link>
      </div>

      {/* ── Search + status filters ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#B0ADA8', pointerEvents: 'none' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher par numéro ou client…"
            style={{
              width: '100%', height: 38, paddingLeft: 36, paddingRight: 14,
              border: '1.5px solid #ECEAE4', borderRadius: 10,
              fontSize: 13, color: '#111110', background: '#fff',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#111110'}
            onBlur={e => e.target.style.borderColor = '#ECEAE4'}
          />
        </div>

        {/* Status filter pills — same onClick logic as original */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {/* "Tous" button */}
          <button
            onClick={() => setStatus(null)}
            style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: status === null ? '1.5px solid #111110' : '1.5px solid #ECEAE4',
              background: status === null ? '#111110' : '#fff',
              color: status === null ? '#fff' : '#6B6860',
              transition: 'all .15s',
            }}
          >
            Tous ({all.length})
          </button>

          {/* Status buttons — same handler as original */}
          {STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setStatus(p => p === s.key ? null : s.key)}
              style={{
                padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: status === s.key ? '1.5px solid #111110' : '1.5px solid #ECEAE4',
                background: status === s.key ? '#111110' : '#fff',
                color: status === s.key ? '#fff' : '#6B6860',
                transition: 'all .15s',
              }}
            >
              {s.label} ({counts[s.key]})
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16,
          padding: '64px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.05)',
        }}>
          <EmptyIcon size={36} style={{ color: '#D8D5CF', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: '#3D3C3A', marginBottom: 8 }}>
            {q || status
              ? 'Aucun résultat pour ces critères.'
              : `Aucun${isFacture ? 'e facture' : ' devis'} pour l'instant.`}
          </p>
          {!q && !status && (
            <Link to={newPath} style={{ marginTop: 16, display: 'inline-block' }}>
              <Btn size="sm"><Plus size={13} />{isFacture ? 'Créer une facture' : 'Créer un devis'}</Btn>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>

          {/* Col headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '130px 1fr 105px 130px 110px 24px',
            gap: 16, padding: '10px 24px',
            background: '#FAFAF8', borderBottom: '1px solid #ECEAE4',
          }}>
            {['Numéro', 'Client', 'Date', 'Total TTC', 'Statut', ''].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B0ADA8' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div>
            {filtered.map((inv, idx) => (
              <Link
                key={inv.id}
                to={`${base}/${inv.id}`}
                style={{
                  display: 'grid', gridTemplateColumns: '130px 1fr 105px 130px 110px 24px',
                  gap: 16, alignItems: 'center', padding: '13px 24px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid #F5F4F1' : 'none',
                  textDecoration: 'none', transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#B0ADA8' }}>
                  {inv.number}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#111110', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {inv.clients?.name ?? <span style={{ color: '#B0ADA8', fontStyle: 'italic' }}>—</span>}
                  </p>
                  {inv.clients?.company && (
                    <p style={{ fontSize: 11, color: '#B0ADA8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, marginTop: 1 }}>
                      {inv.clients.company}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#9B9891' }}>{formatDate(inv.issue_date)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111110', fontFamily: 'DM Mono, monospace' }}>
                  {formatCurrency(inv.total)}
                </span>
                <StatusPill status={inv.status} />
                <ArrowRight size={13} style={{ color: '#D8D5CF' }} />
              </Link>
            ))}
          </div>

          {/* Footer — same data as original */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderTop: '1px solid #F0EEE9', background: '#FAFAF8',
          }}>
            <span style={{ fontSize: 12, color: '#B0ADA8' }}>
              {filtered.length} document{filtered.length !== 1 ? 's' : ''}
              {status ? ` · filtre : ${STATUSES.find(s => s.key === status)?.label}` : ''}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111110', fontFamily: 'DM Mono, monospace' }}>
              Total : {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
