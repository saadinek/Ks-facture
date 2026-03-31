import { format, isAfter } from 'date-fns'
import { fr }              from 'date-fns/locale'

// ── Currency ──────────────────────────────────────────────────
export function formatCurrency(amount, currency = 'MAD') {
  if (amount == null || isNaN(amount)) return '—'
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount)
}

// ── Dates ─────────────────────────────────────────────────────
export function formatDate(date) {
  if (!date) return '—'
  try { return format(new Date(date), 'dd MMM yyyy', { locale: fr }) }
  catch { return '—' }
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function isOverdue(dueDate) {
  if (!dueDate) return false
  return isAfter(new Date(), new Date(dueDate))
}

// ── Invoice numbering ─────────────────────────────────────────
// Starts at 075 for the current year when no prior invoices exist.
// count = number of existing invoices of that type (before this one).
// So first invoice → count=0 → index=75, second → 76, etc.
const INVOICE_START_OFFSET = 74   // first number = offset + 1 = 75

export function makeInvoiceNumber(type, count) {
  const prefix = type === 'facture' ? 'FAC' : 'DEV'
  const year   = new Date().getFullYear()
  const seq    = count + INVOICE_START_OFFSET   // 0 → 74+1=75
  return `${prefix}-${year}-${String(seq).padStart(3, '0')}`
}

// ── Totals ────────────────────────────────────────────────────
export function computeTotals(items = [], taxRate = 20) {
  const subtotal  = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0)
  const taxAmount = subtotal * (taxRate / 100)
  return { subtotal, taxAmount, total: subtotal + taxAmount }
}

// ── UI helpers ────────────────────────────────────────────────
export function cn(...cls) { return cls.filter(Boolean).join(' ') }

export function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// ── Status maps ───────────────────────────────────────────────
export const STATUS_LABEL = {
  brouillon: 'Brouillon',
  envoye:    'Envoyé',
  paye:      'Payé',
  annule:    'Annulé',
}

export const STATUS_STYLE = {
  brouillon: { dot: '#A8A5A0', bg: '#F3F2EF', text: '#6B6860' },
  envoye:    { dot: '#CA8A04', bg: '#FEFCE8', text: '#854D0E' },
  paye:      { dot: '#16A34A', bg: '#F0FDF4', text: '#166534' },
  annule:    { dot: '#DC2626', bg: '#FEF2F2', text: '#991B1B' },
}
