// Imports relatifs :
//   ../components/ui.jsx
//   ../hooks/useData.js
//   ../utils/utils.js

import { useState, useMemo }                                           from 'react'
import { Link }                                                        from 'react-router-dom'
import { Plus, Search, Users, ArrowRight, Building2, Mail, Trash2, AlertTriangle } from 'lucide-react'
import { Btn, Field, Modal }                                           from '../components/ui.jsx'
import { useClients, useCreateClient, useDeleteClient, useClientTotals } from '../hooks/useData.js'
import { formatDate, formatCurrency }                                  from '../utils/utils.js'

// ── 80k warning thresholds ────────────────────────────────────
const WARN_THRESHOLD     = 70_000   // orange warning
const CRITICAL_THRESHOLD = 80_000   // red — legal declaration limit

const NUM = {
  fontFamily: '"Space Grotesk", "DM Mono", ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  letterSpacing: '-0.02em',
}

function ClientThresholdBadge({ clientId, clientTotals }) {
  const total = clientTotals?.[clientId] ?? 0
  if (total < WARN_THRESHOLD) return null

  const isCritical = total >= CRITICAL_THRESHOLD
  const bg         = isCritical ? '#FEF2F2' : '#FFF7ED'
  const border     = isCritical ? '#FECACA' : '#FED7AA'
  const color      = isCritical ? '#DC2626' : '#C2410C'
  const label      = isCritical
    ? `⚠ Seuil 80 000 DH atteint`
    : `⚠ Proche du seuil 80 000 DH`

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, border: `1px solid ${border}`, color,
      borderRadius: 7, padding: '3px 9px',
      fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      <AlertTriangle size={11} />
      <span>{label}</span>
      <span style={{ ...NUM, fontSize: 11 }}>{formatCurrency(total)}</span>
    </span>
  )
}

// ── Avatar with color seeded by name ─────────────────────────

const AVATAR_PALETTES = [
  { bg: '#EEF2FF', fg: '#4F46E5' },
  { bg: '#F0FDF4', fg: '#16A34A' },
  { bg: '#FFFBEB', fg: '#D97706' },
  { bg: '#FFF1F2', fg: '#E11D48' },
  { bg: '#F5F3FF', fg: '#7C3AED' },
  { bg: '#ECFEFF', fg: '#0891B2' },
]

function ClientAvatar({ name, size = 40 }) {
  const idx   = name ? name.charCodeAt(0) % AVATAR_PALETTES.length : 0
  const color = AVATAR_PALETTES[idx]
  const inits = name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') ?? '?'
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.3),
      background: color.bg, color: color.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.35), fontWeight: 700, flexShrink: 0,
    }}>
      {inits}
    </div>
  )
}

// ── Modal nouveau client — logic 100% from uploaded file ──────

function NewClientModal({ onClose }) {
  // — Same state as original —
  const create = useCreateClient()
  const [f, setF]   = useState({ name: '', company: '', email: '', phone: '', address: '', ice: '' })
  const [err, setErr] = useState(null)

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  // — Same submit as original —
  const submit = async e => {
    e.preventDefault()
    if (!f.name.trim()) { setErr('Le nom est obligatoire.'); return }
    try {
      await create.mutateAsync(f)
      onClose()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <Modal title="Nouveau client" onClose={onClose}>
      <form onSubmit={submit} className="px-4 py-5 space-y-3">
        <div className="form-grid-2col">
          <Field label="Nom *"      value={f.name}    onChange={set('name')}    placeholder="Prénom Nom"       wrap="col-span-2" />
          <Field label="Entreprise" value={f.company} onChange={set('company')} placeholder="SARL XYZ" />
          <Field label="ICE"        value={f.ice}     onChange={set('ice')}     placeholder="000000000000000" />
          <Field label="Email"      type="email"       value={f.email}   onChange={set('email')}  placeholder="client@mail.com" />
          <Field label="Téléphone"  value={f.phone}   onChange={set('phone')}   placeholder="06 00 00 00 00" />
          <Field label="Adresse"    value={f.address} onChange={set('address')} placeholder="Rue, Ville" wrap="col-span-2" />
        </div>

        {err && (
          <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/20 rounded px-3 py-2">
            {err}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="secondary" type="button" onClick={onClose}>Annuler</Btn>
          <Btn type="submit" loading={create.isPending}>Créer</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ── Page ─────────────────────────────────────────────────────
// All logic identical to uploaded file — only layout/styles changed

export default function Clients() {
  // — Same data fetching as original —
  const { data: clients = [], isLoading } = useClients()
  const del = useDeleteClient()
  const { data: clientTotals = {} } = useClientTotals()  // for 80k warning

  const [q,     setQ]     = useState('')
  const [modal, setModal] = useState(false)

  // — Same filter logic as original —
  const filtered = useMemo(() => {
    if (!q.trim()) return clients
    const lq = q.toLowerCase()
    return clients.filter(c =>
      c.name?.toLowerCase().includes(lq) ||
      c.company?.toLowerCase().includes(lq) ||
      c.email?.toLowerCase().includes(lq)
    )
  }, [clients, q])

  // — Same remove handler as original —
  const remove = async (e, id) => {
    e.preventDefault()
    if (!confirm('Supprimer ce client ? Cette action est irréversible.')) return
    await del.mutateAsync(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111110', letterSpacing: '-0.02em', margin: 0 }}>
            Clients
          </h1>
          <p style={{ fontSize: 13, color: '#9B9891', marginTop: 5 }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Same onClick as original */}
        <Btn onClick={() => setModal(true)}>
          <Plus size={14} />Nouveau client
        </Btn>
      </div>

      {/* ── Search — same onChange as original ── */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#B0ADA8', pointerEvents: 'none' }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher par nom, entreprise, email…"
          style={{
            width: '100%', height: 42, paddingLeft: 38, paddingRight: 14,
            border: '1.5px solid #ECEAE4', borderRadius: 10,
            fontSize: 13, color: '#111110', background: '#fff',
            outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = '#111110'}
          onBlur={e => e.target.style.borderColor = '#ECEAE4'}
        />
      </div>

      {/* ── List ── */}
      {isLoading ? (
        /* Skeleton */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse" style={{ height: 76, background: '#fff', border: '1px solid #ECEAE4', borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state — same conditions as original */
        <div style={{
          background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16,
          padding: '64px 24px', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
          <Users size={36} style={{ color: '#D8D5CF', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: '#3D3C3A', marginBottom: 8 }}>
            {q ? 'Aucun résultat pour cette recherche.' : "Aucun client pour l'instant."}
          </p>
          {/* Same condition as original */}
          {!q && (
            <button
              onClick={() => setModal(true)}
              style={{
                marginTop: 8,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#111110', color: '#fff', border: 'none',
                borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={13} />Ajouter un client
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => {
            const clientTotal  = clientTotals?.[c.id] ?? 0
            const isCritical   = clientTotal >= CRITICAL_THRESHOLD
            const isWarning    = clientTotal >= WARN_THRESHOLD && !isCritical
            const borderNormal = isCritical ? '#FECACA' : isWarning ? '#FED7AA' : '#ECEAE4'
            const borderHover  = isCritical ? '#F87171' : isWarning ? '#FB923C' : '#D0CEC7'

            return (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                background: '#fff', border: `1px solid ${borderNormal}`,
                borderRadius: 14, textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,.04)',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = borderHover
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.07)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = borderNormal
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)'
              }}
            >
              <ClientAvatar name={c.name} />

              {/* Name + company + threshold badge on mobile */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </p>
                {c.company && (
                  <p style={{ fontSize: 12, color: '#9B9891', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={11} />{c.company}
                  </p>
                )}
                {/* Threshold badge shown inline below name on mobile */}
                <span className="show-mobile-inline">
                  <ClientThresholdBadge clientId={c.id} clientTotals={clientTotals} />
                </span>
              </div>

              {/* 80k threshold badge — desktop only */}
              <span className="hide-mobile">
                <ClientThresholdBadge clientId={c.id} clientTotals={clientTotals} />
              </span>

              {/* Email — hidden on mobile */}
              {c.email && (
                <span className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#B0ADA8', flexShrink: 0 }}>
                  <Mail size={12} />{c.email}
                </span>
              )}

              {/* Date — hidden on mobile */}
              <span className="hide-mobile" style={{ fontSize: 11, color: '#C4C2BD', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                {formatDate(c.created_at)}
              </span>

              {/* Delete + arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={e => remove(e, c.id)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: '1.5px solid #ECEAE4', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#B0ADA8', transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#FECACA'
                    e.currentTarget.style.color = '#DC2626'
                    e.currentTarget.style.background = '#FEF2F2'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#ECEAE4'
                    e.currentTarget.style.color = '#B0ADA8'
                    e.currentTarget.style.background = '#fff'
                  }}
                >
                  <Trash2 size={13} />
                </button>
                <ArrowRight size={15} style={{ color: '#D8D5CF' }} />
              </div>
            </Link>
            )
          })}
        </div>
      )}

      {/* Modal — same condition as original */}
      {modal && <NewClientModal onClose={() => setModal(false)} />}
    </div>
  )
}
