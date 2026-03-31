// Imports relatifs :
//   ../components/ui.jsx
//   ../hooks/useData.js
//   ../store/authStore.js
//   ../utils/utils.js

import { useState }                                               from 'react'
import { Link }                                                   from 'react-router-dom'
import {
  TrendingUp, Clock, FileText, Users, ArrowRight, Plus,
  TrendingDown, Wallet, Trash2, Check, X,
}                                                                 from 'lucide-react'
import { Badge, Btn, Spinner }                                    from '../components/ui.jsx'
import {
  useInvoices, useInvoiceStats, useClients,
  useExpenses, useCreateExpense, useDeleteExpense,
}                                                                 from '../hooks/useData.js'
import { useAuthStore }                                           from '../store/authStore.js'
import { formatCurrency, formatDate, todayISO }                  from '../utils/utils.js'

// ── Numeric font ──────────────────────────────────────────────

const NUM = {
  fontFamily: '"Space Grotesk", "DM Mono", ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  letterSpacing: '-0.02em',
}

const EXPENSE_CATEGORIES = [
  'Sous-traitance', 'Transport', 'Matériel', 'Logiciel / Abonnement',
  'Communication', 'Formation', 'Bureau', 'Impôts / Taxes', 'Autre',
]

// ── KPI card ──────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16,
      padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9B9891' }}>
          {label}
        </span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: valueColor ?? '#111110', lineHeight: 1.1, margin: 0, ...NUM }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="animate-pulse" style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ height: 10, width: 80, background: '#ECEAE4', borderRadius: 6 }} />
        <div style={{ height: 36, width: 36, background: '#ECEAE4', borderRadius: 10 }} />
      </div>
      <div style={{ height: 26, width: 120, background: '#ECEAE4', borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 10, width: 60, background: '#ECEAE4', borderRadius: 6 }} />
    </div>
  )
}

// ── Shared input style ────────────────────────────────────────

const inp = {
  height: 36, border: '1.5px solid #ECEAE4', borderRadius: 8,
  padding: '0 10px', fontSize: 12, color: '#111110',
  background: '#fff', outline: 'none',
  transition: 'border-color .15s', boxSizing: 'border-box', width: '100%',
}

// ── Add expense inline form ───────────────────────────────────

function AddExpenseForm({ onClose }) {
  const createMut = useCreateExpense()
  const [draft, setDraft] = useState({
    label: '', amount: '', expense_date: todayISO(), category: 'Autre',
  })
  const [err, setErr] = useState(null)

  const commit = async () => {
    if (!draft.label.trim())                        { setErr('Le libellé est obligatoire.'); return }
    if (!draft.amount || Number(draft.amount) <= 0) { setErr('Le montant doit être > 0.');   return }
    await createMut.mutateAsync(draft)
    onClose()
  }

  const fo = e => e.target.style.borderColor = '#F97316'
  const bl = e => e.target.style.borderColor = '#ECEAE4'

  return (
    <div style={{ padding: '14px 20px', background: '#FFF7ED', borderTop: '1px solid #FED7AA' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 160px auto', gap: 8, alignItems: 'flex-start' }}>
        <div>
          <input autoFocus value={draft.label}
            onChange={e => setDraft(p => ({ ...p, label: e.target.value }))}
            placeholder="Libellé *" style={inp} onFocus={fo} onBlur={bl}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose() }}
          />
        </div>
        <div>
          <input type="number" min="0" step="0.01" value={draft.amount}
            onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))}
            placeholder="Montant *" style={{ ...inp, ...NUM, textAlign: 'right' }}
            onFocus={fo} onBlur={bl}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose() }}
          />
        </div>
        <div>
          <input type="date" value={draft.expense_date}
            onChange={e => setDraft(p => ({ ...p, expense_date: e.target.value }))}
            style={inp} onFocus={fo} onBlur={bl}
          />
        </div>
        <div>
          <select value={draft.category}
            onChange={e => setDraft(p => ({ ...p, category: e.target.value }))}
            style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 5, paddingTop: 1 }}>
          <button type="button" onClick={commit} disabled={createMut.isPending}
            style={{ height: 36, width: 36, borderRadius: 7, border: 'none', background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Check size={14} />
          </button>
          <button type="button" onClick={onClose}
            style={{ height: 36, width: 36, borderRadius: 7, border: '1.5px solid #ECEAE4', background: '#fff', color: '#6B6860', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      </div>
      {err && <p style={{ fontSize: 11, color: '#DC2626', margin: '6px 0 0' }}>{err}</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile } = useAuthStore()

  // — All data hooks — unchanged invoice hooks + expenses —
  const { data: stats,    isLoading: sl } = useInvoiceStats()
  const { data: invoices, isLoading: il } = useInvoices()
  const { data: clients                 } = useClients()
  const { data: expenses = []           } = useExpenses()
  const deleteMut                         = useDeleteExpense()

  const [showAddExpense, setShowAddExpense] = useState(false)

  const loading   = sl || il
  const recent    = (invoices ?? []).slice(0, 5)
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // — Financial summary —
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const revenue       = stats?.ca ?? 0
  const net           = revenue - totalExpenses
  const recentExpenses = expenses.slice(0, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111110', letterSpacing: '-0.02em', margin: 0 }}>
            {greet}{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#9B9891', marginTop: 5 }}>Voici un aperçu de ton activité</p>
        </div>
        <Link to="/factures/nouvelle">
          <Btn><Plus size={14} />Nouvelle facture</Btn>
        </Link>
      </div>

      {/* ── Invoice KPIs — 4 cards unchanged ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {loading ? (
          [1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="Chiffre d'affaires" value={formatCurrency(stats?.ca ?? 0)}        sub="Factures payées"                         icon={TrendingUp} iconBg="#EEF2FF" iconColor="#4F46E5" />
            <KpiCard label="En attente"          value={formatCurrency(stats?.enAttente ?? 0)} sub={`${stats?.nbEnAttente ?? 0} facture(s)`} icon={Clock}      iconBg="#FFFBEB" iconColor="#D97706" />
            <KpiCard label="Factures"            value={stats?.nbFactures ?? 0}                sub={`${stats?.nbPayees ?? 0} payée(s)`}      icon={FileText}   iconBg="#F0FDF4" iconColor="#16A34A" />
            <KpiCard label="Clients"             value={clients?.length ?? 0}                  sub={`${stats?.nbDevis ?? 0} devis`}          icon={Users}      iconBg="#F5F3FF" iconColor="#7C3AED" />
          </>
        )}
      </div>

      {/* ── Suivi financier — 3 financial KPIs ── */}
      {!loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Wallet size={14} style={{ color: '#6B6860' }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9B9891' }}>
              Suivi financier
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <KpiCard
              label="Revenus encaissés"
              value={formatCurrency(revenue)}
              sub="Factures payées"
              icon={TrendingUp}
              iconBg="#F0FDF4" iconColor="#16A34A" valueColor="#166534"
            />
            <KpiCard
              label="Dépenses"
              value={formatCurrency(totalExpenses)}
              sub={`${expenses.length} dépense(s)`}
              icon={TrendingDown}
              iconBg="#FFF7ED" iconColor="#F97316" valueColor="#C2410C"
            />
            <KpiCard
              label="Résultat net"
              value={formatCurrency(net)}
              sub={net >= 0 ? 'Bénéfice estimé' : 'Déficit estimé'}
              icon={Wallet}
              iconBg={net >= 0 ? '#F0FDF4' : '#FEF2F2'}
              iconColor={net >= 0 ? '#16A34A' : '#DC2626'}
              valueColor={net >= 0 ? '#166534' : '#DC2626'}
            />
          </div>
        </div>
      )}

      {/* ── Dépenses ── */}
      <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0EEE9' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0 }}>Dépenses</p>
            <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 2 }}>
              {expenses.length > 0
                ? `${expenses.length} dépense(s) · total ${formatCurrency(totalExpenses)}`
                : 'Aucune dépense enregistrée'}
            </p>
          </div>
          <button
            onClick={() => setShowAddExpense(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all .15s',
              background: showAddExpense ? '#FFF7ED' : '#fff',
              border: showAddExpense ? '1.5px solid #FED7AA' : '1.5px solid #ECEAE4',
              color: showAddExpense ? '#C2410C' : '#3D3C3A',
            }}
          >
            <Plus size={13} />Ajouter
          </button>
        </div>

        {/* Add form */}
        {showAddExpense && (
          <AddExpenseForm onClose={() => setShowAddExpense(false)} />
        )}

        {/* Column headers */}
        {recentExpenses.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 100px 150px 28px',
            gap: 16, padding: '9px 24px',
            background: '#FAFAF8', borderBottom: '1px solid #F0EEE9',
          }}>
            {['Libellé', 'Montant', 'Date', 'Catégorie', ''].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B0ADA8' }}>{h}</span>
            ))}
          </div>
        )}

        {/* Expense rows */}
        {recentExpenses.length === 0 && !showAddExpense ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <TrendingDown size={28} style={{ color: '#D8D5CF', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: '#9B9891', marginBottom: 12 }}>
              Aucune dépense enregistrée.
            </p>
            <button
              onClick={() => setShowAddExpense(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={13} />Enregistrer une dépense
            </button>
          </div>
        ) : (
          <div>
            {recentExpenses.map((exp, idx) => (
              <div
                key={exp.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 110px 100px 150px 28px',
                  gap: 16, alignItems: 'center', padding: '12px 24px',
                  borderBottom: idx < recentExpenses.length - 1 ? '1px solid #F5F4F1' : 'none',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111110', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exp.label}
                </span>
                <span style={{ ...NUM, fontSize: 13, fontWeight: 600, color: '#C2410C' }}>
                  {formatCurrency(exp.amount)}
                </span>
                <span style={{ ...NUM, fontSize: 12, color: '#9B9891' }}>
                  {formatDate(exp.expense_date)}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 500, color: '#C2410C',
                  background: '#FFF7ED', border: '1px solid #FED7AA',
                  borderRadius: 6, padding: '2px 8px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  display: 'inline-block', maxWidth: '100%',
                }}>
                  {exp.category}
                </span>
                <button
                  onClick={() => deleteMut.mutate(exp.id)}
                  disabled={deleteMut.isPending}
                  style={{
                    width: 26, height: 26, borderRadius: 6, border: 'none',
                    background: 'transparent', color: '#D0CEC7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all .15s', padding: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#D0CEC7'; e.currentTarget.style.background = 'transparent' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Footer with total if more than shown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px', background: '#FAFAF8', borderTop: '1px solid #F0EEE9' }}>
              <span style={{ fontSize: 12, color: '#B0ADA8' }}>
                {expenses.length > recentExpenses.length
                  ? `Affichage des ${recentExpenses.length} plus récentes · ${expenses.length} au total`
                  : `${expenses.length} dépense${expenses.length !== 1 ? 's' : ''}`}
              </span>
              <span style={{ ...NUM, fontSize: 13, fontWeight: 700, color: '#C2410C' }}>
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Activité récente — unchanged ── */}
      <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0EEE9' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111110', margin: 0 }}>Activité récente</p>
            <p style={{ fontSize: 12, color: '#B0ADA8', marginTop: 2 }}>5 derniers documents</p>
          </div>
          <Link to="/factures">
            <Btn variant="ghost" size="sm">Tout voir <ArrowRight size={13} /></Btn>
          </Link>
        </div>

        {!loading && recent.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 110px 130px 115px 24px', gap: 16, padding: '9px 24px', background: '#FAFAF8', borderBottom: '1px solid #F0EEE9' }}>
            {['Numéro', 'Client', 'Date', 'Montant', 'Statut', ''].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B0ADA8' }}>{h}</span>
            ))}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : recent.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <FileText size={30} style={{ color: '#D8D5CF', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#9B9891', marginBottom: 16 }}>Aucune facture pour l'instant.</p>
            <Link to="/factures/nouvelle">
              <Btn variant="secondary" size="sm"><Plus size={13} />Créer ma première facture</Btn>
            </Link>
          </div>
        ) : (
          <div>
            {recent.map((inv, idx) => (
              <Link
                key={inv.id}
                to={`/factures/${inv.id}`}
                style={{
                  display: 'grid', gridTemplateColumns: '130px 1fr 110px 130px 115px 24px',
                  gap: 16, alignItems: 'center', padding: '13px 24px',
                  borderBottom: idx < recent.length - 1 ? '1px solid #F5F4F1' : 'none',
                  textDecoration: 'none', transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ ...NUM, fontSize: 11, color: '#B0ADA8' }}>{inv.number}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111110', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inv.clients?.name ?? '—'}
                </span>
                <span style={{ ...NUM, fontSize: 12, color: '#9B9891' }}>{formatDate(inv.issue_date)}</span>
                <span style={{ ...NUM, fontSize: 13, fontWeight: 600, color: '#111110' }}>{formatCurrency(inv.total)}</span>
                <Badge status={inv.status} />
                <ArrowRight size={13} style={{ color: '#D8D5CF' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
