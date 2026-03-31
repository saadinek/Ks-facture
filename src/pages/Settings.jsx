// Imports relatifs :
//   ../components/ui.jsx
//   ../store/authStore.js
//   ../services/invoiceService.js
//   ../hooks/useData.js

import { useState, useEffect } from 'react'
import {
  User, Building2, Mail, Phone, MapPin, Hash, Save,
  Plus, Trash2, Edit2, Check, X, Zap,
} from 'lucide-react'
import { Card, Btn, Field, Spinner }  from '../components/ui.jsx'
import { useAuthStore }               from '../store/authStore.js'
import { authService }                from '../services/invoiceService.js'
import {
  useServiceTemplates, useCreateServiceTemplate,
  useUpdateServiceTemplate, useDeleteServiceTemplate,
} from '../hooks/useData.js'
import { formatCurrency } from '../utils/utils.js'

const CURRENCIES = ['MAD', 'EUR', 'USD']

// ── Shared numeric font ───────────────────────────────────────
const NUM = {
  fontFamily: '"Space Grotesk", "DM Mono", ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  letterSpacing: '-0.02em',
}

// ── Shared inline input style ─────────────────────────────────
const inp = {
  height: 38, border: '1.5px solid #ECEAE4', borderRadius: 8,
  padding: '0 10px', fontSize: 13, color: '#111110',
  background: '#fff', outline: 'none',
  transition: 'border-color .15s', boxSizing: 'border-box', width: '100%',
}
const focusPurple = e => e.target.style.borderColor = '#4F46E5'
const blurGrey    = e => e.target.style.borderColor = '#ECEAE4'

const sectionCard = {
  background: '#fff', border: '1px solid #ECEAE4',
  borderRadius: 14, padding: '22px 24px',
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
}

const iconBtn = (extra = {}) => ({
  width: 30, height: 30, borderRadius: 7,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'all .15s', ...extra,
})

// ══════════════════════════════════════════════════════════════
//  SERVICE TEMPLATE ROW
// ══════════════════════════════════════════════════════════════

function TemplateRow({ tpl }) {
  const updateMut = useUpdateServiceTemplate()
  const deleteMut = useDeleteServiceTemplate()

  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState({
    label: tpl.label, description: tpl.description, unit_price: tpl.unit_price,
  })

  const commit = async () => {
    if (!draft.label.trim()) return
    await updateMut.mutateAsync({ id: tpl.id, ...draft })
    setEditing(false)
  }
  const cancel = () => {
    setDraft({ label: tpl.label, description: tpl.description, unit_price: tpl.unit_price })
    setEditing(false)
  }
  const onKey = e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }

  if (editing) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto', gap: 8, alignItems: 'center', padding: '10px 14px', background: '#F8F7FF', borderRadius: 9, border: '1.5px solid #C7C4FF' }}>
      <input autoFocus value={draft.label}
        onChange={e => setDraft(p => ({ ...p, label: e.target.value, description: e.target.value }))}
        placeholder="Libellé" style={inp} onFocus={focusPurple} onBlur={blurGrey} onKeyDown={onKey} />
      <input value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
        placeholder="Description" style={inp} onFocus={focusPurple} onBlur={blurGrey} onKeyDown={onKey} />
      <input type="number" min="0" step="0.01" value={draft.unit_price}
        onChange={e => setDraft(p => ({ ...p, unit_price: e.target.value }))}
        placeholder="Prix HT" style={{ ...inp, ...NUM, textAlign: 'right' }}
        onFocus={focusPurple} onBlur={blurGrey} onKeyDown={onKey} />
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" onClick={commit} disabled={updateMut.isPending}
          style={iconBtn({ border: 'none', background: '#4F46E5', color: '#fff' })}>
          <Check size={13} />
        </button>
        <button type="button" onClick={cancel}
          style={iconBtn({ border: '1.5px solid #ECEAE4', background: '#fff', color: '#6B6860' })}>
          <X size={13} />
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto', gap: 8, alignItems: 'center', padding: '10px 14px', background: '#fff', borderRadius: 9, border: '1px solid #ECEAE4', transition: 'border-color .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#C7C4FF'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#ECEAE4'}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: '#111110', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.label}</span>
      <span style={{ fontSize: 12, color: '#9B9891', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tpl.description !== tpl.label ? tpl.description : <span style={{ color: '#D0CEC7', fontStyle: 'italic' }}>—</span>}
      </span>
      <span style={{ ...NUM, fontSize: 13, fontWeight: 600, color: '#3D3C3A', textAlign: 'right' }}>
        {formatCurrency(tpl.unit_price)}
      </span>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => setEditing(true)}
          style={iconBtn({ border: '1.5px solid #ECEAE4', background: '#fff', color: '#B0ADA8' })}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ECEAE4'; e.currentTarget.style.color = '#B0ADA8' }}
        ><Edit2 size={12} /></button>
        <button type="button" onClick={() => deleteMut.mutate(tpl.id)} disabled={deleteMut.isPending}
          style={iconBtn({ border: '1.5px solid #ECEAE4', background: '#fff', color: '#B0ADA8' })}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ECEAE4'; e.currentTarget.style.color = '#B0ADA8'; e.currentTarget.style.background = '#fff' }}
        ><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

function AddTemplateRow() {
  const createMut = useCreateServiceTemplate()
  const EMPTY = { label: '', description: '', unit_price: '' }
  const [open,  setOpen]  = useState(false)
  const [draft, setDraft] = useState(EMPTY)
  const [err,   setErr]   = useState(null)

  const commit = async () => {
    if (!draft.label.trim())                              { setErr('Le libellé est obligatoire.'); return }
    if (!draft.unit_price || Number(draft.unit_price) <= 0) { setErr('Le prix doit être > 0.'); return }
    await createMut.mutateAsync({ ...draft, description: draft.description || draft.label })
    setDraft(EMPTY); setErr(null); setOpen(false)
  }
  const cancel = () => { setDraft(EMPTY); setErr(null); setOpen(false) }
  const onKey  = e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 500, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    ><Plus size={14} />Ajouter un service</button>
  )

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto', gap: 8, alignItems: 'flex-start', padding: '12px 14px', background: '#F8F7FF', borderRadius: 9, border: '1.5px solid #C7C4FF' }}>
        <input autoFocus value={draft.label} onChange={e => setDraft(p => ({ ...p, label: e.target.value }))}
          placeholder="Libellé *" style={inp} onFocus={focusPurple} onBlur={blurGrey} onKeyDown={onKey} />
        <input value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
          placeholder="Description (optionnel)" style={inp} onFocus={focusPurple} onBlur={blurGrey} onKeyDown={onKey} />
        <input type="number" min="0" step="0.01" value={draft.unit_price}
          onChange={e => setDraft(p => ({ ...p, unit_price: e.target.value }))}
          placeholder="Prix HT *" style={{ ...inp, ...NUM, textAlign: 'right' }}
          onFocus={focusPurple} onBlur={blurGrey} onKeyDown={onKey} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={commit} disabled={createMut.isPending}
            style={{ ...iconBtn({ border: 'none', background: '#4F46E5', color: '#fff' }), height: 38 }}>
            <Check size={13} />
          </button>
          <button type="button" onClick={cancel}
            style={{ ...iconBtn({ border: '1.5px solid #ECEAE4', background: '#fff', color: '#6B6860' }), height: 38 }}>
            <X size={13} />
          </button>
        </div>
      </div>
      {err && <p style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0 14px' }}>{err}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  PAGE
// ══════════════════════════════════════════════════════════════

export default function Settings() {

  // ── Profile logic — 100% unchanged ──────────────────────────
  const { user, profile, patchProfile } = useAuthStore()
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [ok,   setOk]   = useState(false)
  const [err,  setErr]  = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        company:   profile.company   ?? '',
        email:     profile.email     ?? user?.email ?? '',
        phone:     profile.phone     ?? '',
        address:   profile.address   ?? '',
        ice:       profile.ice       ?? '',
        currency:  profile.currency  ?? 'MAD',
      })
    }
  }, [profile, user])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setBusy(true); setOk(false); setErr(null)
    try {
      await authService.updateProfile(user.id, form)
      patchProfile(form)
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // ── Templates ────────────────────────────────────────────────
  const { data: templates = [], isLoading: tlLoading } = useServiceTemplates()

  if (!form) return (
    <div className="space-y-4 max-w-2xl">
      <div className="h-8 w-40 bg-[#E8E6E0] rounded animate-pulse" />
      <div className="h-64 bg-white border border-[#E8E6E0] rounded-xl animate-pulse" />
    </div>
  )

  return (
    <div className="space-y-6 stagger max-w-2xl">

      <div>
        <h1 className="text-2xl font-semibold text-[#1A1917]">Paramètres</h1>
        <p className="text-sm text-[#A8A5A0] mt-0.5">Ces informations apparaîtront sur tes factures.</p>
      </div>

      {/* ── Profile form — unchanged ── */}
      <form onSubmit={submit} className="space-y-5">
        <Card>
          <Card.Head title="Informations personnelles" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom complet" value={form.full_name} onChange={set('full_name')} icon={User}  placeholder="Haytam Benali" wrap="col-span-2" />
            <Field label="Email" type="email" value={form.email} onChange={set('email')}  icon={Mail}  placeholder="toi@mail.com" />
            <Field label="Téléphone"   value={form.phone}     onChange={set('phone')}     icon={Phone} placeholder="06 00 00 00 00" />
          </div>
        </Card>

        <Card>
          <Card.Head title="Mon entreprise" sub="Informations fiscales et coordonnées" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom de l'entreprise" value={form.company}  onChange={set('company')}  icon={Building2} placeholder="Mon Auto-Entreprise" wrap="col-span-2" />
            <Field label="Adresse"             value={form.address}  onChange={set('address')}  icon={MapPin}    placeholder="N° Rue, Quartier, Ville" wrap="col-span-2" />
            <Field label="ICE"                 value={form.ice}      onChange={set('ice')}      icon={Hash}      placeholder="000000000000000" hint="Identifiant Commun de l'Entreprise" />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#6B6860] tracking-widest uppercase">Devise par défaut</label>
              <div className="flex gap-2">
                {CURRENCIES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, currency: c }))}
                    className={['px-4 h-9 rounded-md text-sm font-medium border transition-all',
                      form.currency === c ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                          : 'bg-white border-[#E8E6E0] text-[#6B6860] hover:border-[#D0CEC7]',
                    ].join(' ')}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {err && <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg px-4 py-2.5">{err}</p>}
        {ok  && <p className="text-sm text-[#16A34A] bg-[#F0FDF4] border border-[#16A34A]/20 rounded-lg px-4 py-2.5">✓ Modifications enregistrées.</p>}

        <div className="flex justify-end">
          <Btn type="submit" loading={busy}><Save size={14} />Enregistrer</Btn>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════
          PRESTATIONS RAPIDES — Supabase-backed, outside profile form
      ══════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #F0EEE9' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={15} style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0 }}>Prestations rapides</p>
            <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 2 }}>
              Ces services apparaîtront comme raccourcis dans le formulaire de facturation.
            </p>
          </div>
        </div>

        {tlLoading ? <Spinner /> : (
          <>
            {templates.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto', gap: 8, padding: '0 14px', marginBottom: 8 }}>
                {['Libellé', 'Description', 'Prix HT', ''].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B0ADA8' }}>{h}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {templates.length === 0
                ? <p style={{ fontSize: 13, color: '#B0ADA8', fontStyle: 'italic', padding: '6px 14px' }}>Aucun service enregistré.</p>
                : templates.map(tpl => <TemplateRow key={tpl.id} tpl={tpl} />)
              }
            </div>
            <AddTemplateRow />
          </>
        )}
      </div>

    </div>
  )
}
