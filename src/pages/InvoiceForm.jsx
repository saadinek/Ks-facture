// Imports relatifs :
//   ../components/ui.jsx
//   ../hooks/useData.js
//   ../services/invoiceService.js
//   ../utils/utils.js

import { useState, useEffect, useCallback }            from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, Zap, AlertTriangle } from 'lucide-react'
import { Btn }                                         from '../components/ui.jsx'
import { useClients, useServiceTemplates, useClientTotals } from '../hooks/useData.js'
import { invoiceService }                              from '../services/invoiceService.js'
import { formatCurrency, computeTotals, todayISO }    from '../utils/utils.js'

// ─────────────────────────────────────────────────────────────
//  NUMERIC FONT — Space Grotesk
// ─────────────────────────────────────────────────────────────

const NUM = {
  fontFamily: '"Space Grotesk", "DM Mono", ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  letterSpacing: '-0.02em',
}

// ─────────────────────────────────────────────────────────────
//  QUICK-CLIENT trigger (Clinique Al Madina special button)
//  The quick-action shows the FIRST saved template automatically.
// ─────────────────────────────────────────────────────────────

const QUICK_CLIENT_MATCH = 'clinique al madina'

// ─────────────────────────────────────────────────────────────
//  80K WARNING THRESHOLDS
// ─────────────────────────────────────────────────────────────

const WARN_THRESHOLD     = 70_000   // orange
const CRITICAL_THRESHOLD = 80_000   // red
// ─────────────────────────────────────────────────────────────

const inputBase = {
  width: '100%', height: 40, minHeight: 40,
  border: '1.5px solid #ECEAE4', borderRadius: 9,
  padding: '0 12px', fontSize: 13, color: '#111110',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .15s',
  WebkitAppearance: 'none', appearance: 'none',
}
const labelBase = {
  display: 'block', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: '#9B9891', marginBottom: 6,
}

function StyledInput({ label, wrap, style, ...props }) {
  return (
    <div style={wrap ? { gridColumn: wrap } : {}}>
      {label && <label style={labelBase}>{label}</label>}
      <input
        style={{ ...inputBase, ...style }}
        onFocus={e => e.target.style.borderColor = '#111110'}
        onBlur={e => e.target.style.borderColor = '#ECEAE4'}
        {...props}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  BLANK LINE
// ─────────────────────────────────────────────────────────────

const BLANK = { description: '', quantity: 1, unit_price: 0 }

// ─────────────────────────────────────────────────────────────
//  LINE ITEM ROW — unchanged
// ─────────────────────────────────────────────────────────────

function LineItem({ item, idx, onChange, onRemove, solo }) {
  return (
    <div className="line-item-grid" style={{
      padding: '10px 14px', background: '#FAFAF8',
      borderRadius: 10, border: '1px solid #F0EEE9',
    }}>
      <input
        style={{ ...inputBase, background: '#fff' }}
        placeholder="Description du produit ou service"
        value={item.description}
        onChange={e => onChange(idx, 'description', e.target.value)}
        onFocus={e => e.target.style.borderColor = '#111110'}
        onBlur={e => e.target.style.borderColor = '#ECEAE4'}
      />
      <input
        style={{ ...inputBase, background: '#fff', textAlign: 'right' }}
        type="number" placeholder="Qté" min="0" step="0.01"
        value={item.quantity}
        onChange={e => onChange(idx, 'quantity', e.target.value)}
        onFocus={e => e.target.style.borderColor = '#111110'}
        onBlur={e => e.target.style.borderColor = '#ECEAE4'}
      />
      <input
        style={{ ...inputBase, background: '#fff', textAlign: 'right' }}
        type="number" placeholder="Prix HT" min="0" step="0.01"
        value={item.unit_price}
        onChange={e => onChange(idx, 'unit_price', e.target.value)}
        onFocus={e => e.target.style.borderColor = '#111110'}
        onBlur={e => e.target.style.borderColor = '#ECEAE4'}
      />
      <div className="line-item-total" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111110', ...NUM, textAlign: 'right' }}>
          {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
        </span>
        <button
          type="button" disabled={solo} onClick={() => onRemove(idx)}
          style={{
            width: 30, height: 30, borderRadius: 7,
            border: '1.5px solid #ECEAE4', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: solo ? 'not-allowed' : 'pointer',
            opacity: solo ? .3 : 1, color: '#B0ADA8', transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!solo) { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ECEAE4'; e.currentTarget.style.color = '#B0ADA8'; e.currentTarget.style.background = '#fff' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  TEMPLATES PANEL
//  Now reads from the shared useServiceTemplates hook (dynamic).
//  If no templates exist yet, falls back gracefully to empty state.
// ─────────────────────────────────────────────────────────────

function TemplatesPanel({ templates, onAdd, selectedClientName }) {
  // Quick-action: first template when Clinique Al Madina is selected
  const isQuickClient  = selectedClientName &&
    selectedClientName.toLowerCase().includes(QUICK_CLIENT_MATCH)
  const quickTemplate  = templates[0] ?? null   // first saved template

  if (templates.length === 0) return null        // hide panel if no templates saved

  return (
    <div style={{
      background: '#F8F7FF', border: '1px solid #E0DEFF',
      borderRadius: 10, padding: '14px 16px', marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#4F46E5' }}>
            Services rapides
          </span>
        </div>
      </div>

      {/* Quick-action button — only when Clinique Al Madina is selected */}
      {isQuickClient && quickTemplate && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => onAdd(quickTemplate)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#4F46E5', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity .15s',
              width: '100%', justifyContent: 'space-between',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', minWidth: 0 }}>
              <Plus size={13} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quickTemplate.label}</span>
            </span>
            <span style={{ ...NUM, fontSize: 13, fontWeight: 700, opacity: .9 }}>
              {formatCurrency(quickTemplate.unit_price)}
            </span>
          </button>
          <div style={{ height: 1, background: '#E0DEFF', margin: '12px 0 0' }} />
        </div>
      )}

      {/* All template chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {templates.map(tpl => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onAdd(tpl)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fff', color: '#3D3C3A',
              border: '1.5px solid #E0DEFF', borderRadius: 7,
              padding: '5px 11px', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all .15s',
              maxWidth: '100%', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5'; e.currentTarget.style.background = '#F0EFFE' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0DEFF'; e.currentTarget.style.color = '#3D3C3A'; e.currentTarget.style.background = '#fff' }}
          >
            <Plus size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{tpl.label}</span>
            <span style={{ ...NUM, fontSize: 11, fontWeight: 600, color: '#6B6860', flexShrink: 0 }}>
              {formatCurrency(tpl.unit_price)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PAGE COMPONENT — all invoice logic unchanged
// ─────────────────────────────────────────────────────────────

export default function InvoiceForm({ type, edit = false }) {
  const navigate               = useNavigate()
  const { id }                 = useParams()
  const [params]               = useSearchParams()
  const { data: clients = [] } = useClients()

  // Dynamic templates from Supabase (shared with Settings)
  const { data: templates = [] } = useServiceTemplates()

  // Per-client cumulative totals for 80k warning
  const { data: clientTotals = {} } = useClientTotals()

  const isFacture = type === 'facture'
  const base      = isFacture ? '/factures' : '/devis'

  // ── State — unchanged ──────────────────────────────────────
  const [form, setForm] = useState({
    client_id:  params.get('client') ?? '',
    issue_date: todayISO(),
    due_date:   '',
    tax_rate:   20,
    notes:      '',
  })
  const [items,       setItems]       = useState([{ ...BLANK }])
  const [busy,        setBusy]        = useState(false)
  const [err,         setErr]         = useState(null)
  const [initLoading, setInitLoading] = useState(edit)

  // ── useEffect — unchanged ──────────────────────────────────
  useEffect(() => {
    if (!edit || !id) return
    invoiceService.getById(id).then(inv => {
      setForm({
        client_id:  inv.client_id  ?? '',
        issue_date: inv.issue_date,
        due_date:   inv.due_date   ?? '',
        tax_rate:   inv.tax_rate   ?? 20,
        notes:      inv.notes      ?? '',
      })
      setItems(inv.invoice_items?.length ? inv.invoice_items : [{ ...BLANK }])
      setInitLoading(false)
    })
  }, [edit, id])

  // ── Item callbacks — unchanged ─────────────────────────────
  const onItemChange = useCallback((idx, key, val) => {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  }, [])

  const addLine    = () => setItems(p => [...p, { ...BLANK }])
  const removeLine = idx => setItems(p => p.length > 1 ? p.filter((_, i) => i !== idx) : p)

  // ── Add templated line — unchanged ─────────────────────────
  const addTemplatedLine = useCallback((tpl) => {
    const newLine = {
      description: tpl.description || tpl.label,
      quantity:    tpl.quantity ?? 1,
      unit_price:  tpl.unit_price,
    }
    setItems(prev => {
      const onlyBlank =
        prev.length === 1 &&
        !String(prev[0].description).trim() &&
        Number(prev[0].unit_price) === 0
      return onlyBlank ? [newLine] : [...prev, newLine]
    })
  }, [])

  // ── Totals — unchanged ─────────────────────────────────────
  const { subtotal, taxAmount, total } = computeTotals(items, form.tax_rate)

  // ── Save — unchanged ───────────────────────────────────────
  const save = async (e, status) => {
    e.preventDefault()
    const valid = items.filter(i =>
      String(i.description).trim() && Number(i.unit_price) > 0
    )
    if (!valid.length) {
      setErr('Ajoute au moins une ligne avec une description et un prix.')
      return
    }
    setBusy(true); setErr(null)
    try {
      const payload = { ...form, status }
      if (edit) {
        await invoiceService.update(id, payload, valid)
        navigate(`${base}/${id}`)
      } else {
        const inv = await invoiceService.create(type, payload, valid)
        navigate(`${base}/${inv.id}`)
      }
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  // ── Loading skeleton — unchanged ───────────────────────────
  if (initLoading) {
    return (
      <div className="animate-pulse" style={{
        height: 280, background: '#fff',
        border: '1px solid #ECEAE4', borderRadius: 14,
      }} />
    )
  }

  // ── Selected client + 80k threshold check ─────────────────
  const selectedClient     = clients.find(c => c.id === form.client_id)
  const selectedClientName = selectedClient
    ? (selectedClient.name || selectedClient.company || '')
    : ''
  const selectedClientTotal    = form.client_id ? (clientTotals[form.client_id] ?? 0) : 0
  const clientIsCritical        = selectedClientTotal >= CRITICAL_THRESHOLD
  const clientIsWarning         = selectedClientTotal >= WARN_THRESHOLD && !clientIsCritical

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 800, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to={base} style={{
            width: 34, height: 34, borderRadius: 9,
            border: '1.5px solid #ECEAE4', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B6860', textDecoration: 'none', flexShrink: 0, transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#111110'; e.currentTarget.style.color = '#111110' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ECEAE4'; e.currentTarget.style.color = '#6B6860' }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111110', letterSpacing: '-0.02em', margin: 0 }}>
            {edit ? `Modifier la ${type}` : `Nouvelle ${type}`}
          </h1>
          <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 2 }}>
            {edit ? 'Modifie les informations ci-dessous' : 'Remplis les champs pour créer le document'}
          </p>
        </div>
      </div>

      <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Informations générales ── */}
        <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #F0EEE9' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0 }}>Informations générales</p>
          </div>
          <div className="form-grid-2col">

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelBase}>Client</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  style={{ ...inputBase, paddingRight: 36, WebkitAppearance: 'none', appearance: 'none', cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#111110'}
                  onBlur={e => e.target.style.borderColor = '#ECEAE4'}
                >
                  <option value="">— Sans client —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` · ${c.company}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#B0ADA8', pointerEvents: 'none' }} />
              </div>

              {/* 80k threshold warning — shown when selected client approaches limit */}
              {(clientIsWarning || clientIsCritical) && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginTop: 8, padding: '9px 12px',
                  background: clientIsCritical ? '#FEF2F2' : '#FFF7ED',
                  border: `1px solid ${clientIsCritical ? '#FECACA' : '#FED7AA'}`,
                  borderRadius: 8,
                }}>
                  <AlertTriangle size={14} style={{ color: clientIsCritical ? '#DC2626' : '#F97316', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: clientIsCritical ? '#DC2626' : '#C2410C', margin: 0 }}>
                      {clientIsCritical
                        ? 'Seuil des 80 000 DH atteint — déclaration TVA requise'
                        : 'Attention : ce client approche du seuil de 80 000 DH'}
                    </p>
                    <p style={{ fontSize: 11, color: clientIsCritical ? '#DC2626' : '#C2410C', opacity: .8, margin: '2px 0 0' }}>
                      Total facturé à ce client :{' '}
                      <span style={{ fontFamily: '"Space Grotesk", monospace', fontWeight: 700 }}>
                        {formatCurrency(selectedClientTotal)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <StyledInput label="Date d'émission" type="date" value={form.issue_date}
              onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />

            {isFacture && (
              <StyledInput label="Date d'échéance (optionnel)" type="date" value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelBase}>TVA applicable</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 10, 14, 20].map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(p => ({ ...p, tax_rate: r }))}
                    style={{
                      padding: '0 16px', height: 40, borderRadius: 9,
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      border: form.tax_rate === r ? '2px solid #111110' : '1.5px solid #ECEAE4',
                      background: form.tax_rate === r ? '#111110' : '#fff',
                      color: form.tax_rate === r ? '#fff' : '#6B6860',
                      transition: 'all .15s',
                    }}>{r}%</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Lignes ── */}
        <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #F0EEE9' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0 }}>Lignes de facturation</p>
            <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 2 }}>Décris chaque produit ou service</p>
          </div>

          {/* ── Templates panel — now dynamic ── */}
          <TemplatesPanel
            templates={templates}
            onAdd={addTemplatedLine}
            selectedClientName={selectedClientName}
          />

          {/* Col labels — hidden on mobile */}
          <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px auto', gap: 10, marginBottom: 8, paddingLeft: 14, paddingRight: 14 }}>
            {['Description', 'Quantité', 'Prix unit. HT', ''].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B0ADA8' }}>{h}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, idx) => (
              <LineItem key={idx} item={it} idx={idx}
                onChange={onItemChange} onRemove={removeLine} solo={items.length === 1} />
            ))}
          </div>

          <button type="button" onClick={addLine}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 500, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Plus size={14} />Ajouter une ligne
          </button>

          {/* Totals — full width on mobile */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1.5px solid #ECEAE4' }}>
            <div style={{ marginLeft: 'auto', width: '100%', maxWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#6B6860' }}>Sous-total HT</span>
                <span style={{ fontSize: 13, color: '#6B6860', ...NUM }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#6B6860' }}>TVA ({form.tax_rate}%)</span>
                <span style={{ fontSize: 13, color: '#6B6860', ...NUM }}>{formatCurrency(taxAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid #ECEAE4' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111110' }}>Total TTC</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111110', ...NUM }}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F0EEE9' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0 }}>Notes</p>
            <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 2 }}>Conditions de paiement, mentions légales…</p>
          </div>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3} placeholder="Ex : Paiement à 30 jours fin de mois."
            style={{
              width: '100%', border: '1.5px solid #ECEAE4', borderRadius: 9,
              padding: '10px 12px', fontSize: 13, color: '#111110',
              background: '#fff', outline: 'none', resize: 'vertical',
              lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#111110'}
            onBlur={e => e.target.style.borderColor = '#ECEAE4'}
          />
        </div>

        {/* ── Error ── */}
        {err && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px' }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{err}</p>
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          <Link to={base}
            style={{ fontSize: 13, color: '#9B9891', textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#111110'}
            onMouseLeave={e => e.currentTarget.style.color = '#9B9891'}
          >Annuler</Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="secondary" type="button" loading={busy} onClick={e => save(e, 'brouillon')}>
              Sauvegarder brouillon
            </Btn>
            <Btn type="button" loading={busy} onClick={e => save(e, 'envoye')}>
              {isFacture ? 'Créer & marquer envoyée' : 'Créer & envoyer le devis'}
            </Btn>
          </div>
        </div>

      </form>
    </div>
  )
}
