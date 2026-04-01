// Imports relatifs :
//   ../hooks/useData.js
//   ../utils/utils.js

import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Send, CheckCircle, Trash2, Printer } from 'lucide-react'
import { useDeleteInvoice, useInvoice, useUpdateStatus } from '../hooks/useData.js'
import { formatCurrency, formatDate }                    from '../utils/utils.js'

// ── Numeric font — Space Grotesk ─────────────────────────────
// Applied only to: invoice number, dates, quantities,
// unit prices, line totals, subtotal, TVA, grand total.

const NUM = {
  fontFamily: '"Space Grotesk", "DM Mono", ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  letterSpacing: '-0.02em',
}

// ── Status config — unchanged ─────────────────────────────────

const STATUS_CFG = {
  brouillon: { label: 'Brouillon', bg: '#F5F4F1', text: '#6B6860', dot: '#C4C2BD' },
  envoye:    { label: 'Envoyé',    bg: '#FFFBEB', text: '#92400E', dot: '#D97706' },
  paye:      { label: 'Payé',      bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  annule:    { label: 'Annulé',    bg: '#FEF2F2', text: '#991B1B', dot: '#DC2626' },
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.brouillon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: c.bg, color: c.text,
      borderRadius: 99, padding: '5px 13px',
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {c.label}
    </span>
  )
}

// ── Action button — unchanged ─────────────────────────────────

function ActionBtn({ onClick, disabled, children, variant = 'default', icon: Icon }) {
  const styles = {
    primary: { background: '#111110', color: '#fff', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,.18)' },
    danger:  { background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA' },
    default: { background: '#fff',    color: '#3D3C3A', border: '1.5px solid #ECEAE4' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 9,
        fontSize: 12, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .6 : 1, transition: 'opacity .15s',
        ...styles[variant],
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '.8' }}
      onMouseLeave={e => e.currentTarget.style.opacity = disabled ? '.6' : '1'}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  )
}

// ── Amount in words (French) — unchanged ─────────────────────

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
               'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept',
               'dix-huit', 'dix-neuf']
const TENS  = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante',
               'quatre-vingt', 'quatre-vingt']

function belowHundred(n) {
  if (n < 20) return UNITS[n]
  const t = Math.floor(n / 10), u = n % 10
  if (t === 7) return u === 1 ? 'soixante et onze' : `soixante-${UNITS[10 + u]}`
  if (t === 9) return u === 0 ? 'quatre-vingt-dix' : `quatre-vingt-${UNITS[10 + u]}`
  if (u === 0) return TENS[t] + (t === 8 ? 's' : '')
  if (u === 1 && t !== 8) return `${TENS[t]} et un`
  return `${TENS[t]}-${UNITS[u]}`
}

function belowThousand(n) {
  if (n < 100) return belowHundred(n)
  const h = Math.floor(n / 100), r = n % 100
  const prefix = h === 1 ? 'cent' : `${UNITS[h]} cent${r === 0 && h > 1 ? 's' : ''}`
  return r === 0 ? prefix : `${prefix} ${belowHundred(r)}`
}

function numberToWords(amount) {
  if (!amount && amount !== 0) return ''
  const n = Math.round(Number(amount))
  if (n === 0) return 'zéro'
  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000), r = n % 1_000_000
    const mStr = m === 1 ? 'un million' : `${belowThousand(m)} millions`
    return r === 0 ? mStr : `${mStr} ${numberToWords(r)}`
  }
  if (n >= 1000) {
    const k = Math.floor(n / 1000), r = n % 1000
    const kStr = k === 1 ? 'mille' : `${belowThousand(k)} mille`
    return r === 0 ? kStr : `${kStr} ${belowThousand(r)}`
  }
  return belowThousand(n)
}

function amountInWords(total) {
  if (!total && total !== 0) return ''
  const n = Number(total)
  const whole = Math.floor(n)
  const cents = Math.round((n - whole) * 100)
  let str = numberToWords(whole) + ' dirhams'
  if (cents > 0) str += ` et ${numberToWords(cents)} centimes`
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ── PDF filename generator ────────────────────────────────────
// Controls the suggested filename when user picks "Save as PDF"
// in the browser print dialog (via document.title trick).
//
// Format : Facture_CLIENTNAME_DATE.pdf
// Example: Facture_CLINIQUE_AL_MADINA_2026-03-30.pdf
//
// Rules:
//   - prefer client.name, fall back to client.company, then "Client"
//   - prefer issue_date, fall back to invoice_date
//   - spaces → underscores
//   - strip invalid filename chars: / \ : * ? " < > |

function makePdfFilename(invoice) {
  const rawName  = invoice.clients?.name || invoice.clients?.company || 'Client'
  const rawDate  = invoice.issue_date   || invoice.invoice_date      || ''

  const safeName = rawName
    .trim()
    .replace(/[/\\:*?"<>|]/g, '')   // strip invalid chars
    .replace(/\s+/g, '_')            // spaces → underscores
    .replace(/_+/g, '_')             // collapse multiple underscores
    .toUpperCase()

  const safeDate = rawDate.slice(0, 10)   // keep YYYY-MM-DD portion only

  return `Facture_${safeName}_${safeDate}`
}

// ── Page ─────────────────────────────────────────────────────

export default function InvoiceDetail() {
  const params   = useParams()
  const id       = params.id || params.invoiceId
  const navigate = useNavigate()

  const { data: invoice, isLoading, error } = useInvoice(id)
  const deleteInvoice = useDeleteInvoice()
  const updateStatus  = useUpdateStatus()

  // ── Loading / error / not-found — unchanged ────────────────

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
        <div className="animate-pulse" style={{ height: 12, width: 80, background: '#ECEAE4', borderRadius: 6 }} />
        <div className="animate-pulse" style={{ height: 500, background: '#fff', border: '1px solid #ECEAE4', borderRadius: 4 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#DC2626' }}>Erreur : {error.message}</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#9B9891' }}>Document introuvable.</p>
      </div>
    )
  }

  // ── Handlers — 100% unchanged ─────────────────────────────

  const handleDelete = async () => {
    const ok = window.confirm('Voulez-vous vraiment supprimer cette facture ?')
    if (!ok) return
    try {
      await deleteInvoice.mutateAsync(invoice.id)
      navigate('/factures')
    } catch (e) { alert(e.message) }
  }

  const handleMarkSent = async () => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: 'envoye' })
      alert('Facture marquée comme envoyée.')
    } catch (e) { alert(e.message) }
  }

  const handleMarkPaid = async () => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: 'paye' })
      alert('Facture marquée comme payée.')
    } catch (e) { alert(e.message) }
  }

  const handleEdit = () => navigate(`/factures/${invoice.id}/modifier`)

  // ── Print handler — sets document.title for PDF filename ──
  // The browser uses document.title as the default "Save as PDF" filename.
  // We swap it before print and restore it after.
  const handlePrint = () => {
    const filename    = makePdfFilename(invoice)
    const prevTitle   = document.title
    document.title    = filename
    window.print()
    // Restore after a tick so it doesn't affect ongoing render
    setTimeout(() => { document.title = prevTitle }, 500)
  }

  // ── Derived values ────────────────────────────────────────

  const items     = invoice.invoice_items || []
  const client    = invoice.clients
  const isDevis   = invoice.type === 'devis'
  const docLabel  = isDevis ? 'DEVIS' : 'FACTURE'

  const subtotal  = invoice.subtotal   ?? items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const taxRate   = invoice.tax_rate   ?? 20
  const taxAmount = invoice.tax_amount ?? subtotal * (taxRate / 100)
  const total     = invoice.total      ?? subtotal + taxAmount
  const totalWords = amountInWords(total)

  const ACCENT = '#E8872A'
  // Internal horizontal gutter used consistently throughout
  const G = '36px'

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Styles ─────────────────────────────────────────────
          Screen : flat white sheet, full-width within content area.
          Print  : true A4 page — 210mm × 297mm, no card/sticker.

          Root cause of the "centered sticker" problem:
            - The React app has a sidebar + main wrapper that limits
              the content column width and adds padding.
            - On print we must escape that layout entirely so the
              invoice fills the physical A4 page from edge to edge.

          Fix:
            - Hide everything except .invoice-doc (sidebar, nav,
              the main wrapper, all .no-print elements).
            - Force .invoice-doc to position:fixed top-left and fill
              100vw × 100vh (which maps to full A4 in print mode).
            - Internal padding (14mm sides) replaces @page margins.
      ─────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        /* ── Screen ── */
        .invoice-doc {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Mobile invoice adjustments ── */
        @media (max-width: 767px) {
          .invoice-emitter-meta {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .invoice-emitter-meta > *:last-child {
            text-align: left !important;
          }
          .invoice-emitter-meta table {
            margin-left: 0 !important;
          }
          .invoice-client-grid {
            grid-template-columns: 1fr !important;
          }
          .invoice-items-table th,
          .invoice-items-table td {
            padding: 8px 8px !important;
            font-size: 12px !important;
          }
          .invoice-items-table th:nth-child(3),
          .invoice-items-table td:nth-child(3) {
            display: none !important;
          }
        }

        /* ── Print ── */
        @media print {
          /* 1. A4 page — zero browser margins */
          @page {
            size: 210mm 297mm portrait;
            margin: 0;
          }

          /* 2. Reset html/body */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* 3. Hide everything — then reveal only the invoice */
          body * {
            visibility: hidden !important;
          }
          .invoice-doc,
          .invoice-doc * {
            visibility: visible !important;
          }

          /* 4. Position the invoice to fill the A4 sheet */
          .invoice-doc {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            font-family: "DM Sans", system-ui, sans-serif !important;
            font-size: 13px !important;
            color: #1A1917 !important;
          }

          /* 5. Undo mobile layout overrides — always print as desktop */
          .invoice-emitter-meta {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            gap: 32px !important;
          }
          .invoice-emitter-meta > *:last-child {
            text-align: right !important;
          }
          .invoice-emitter-meta table {
            margin-left: auto !important;
          }
          .invoice-client-grid {
            display: grid !important;
            grid-template-columns: auto 1fr !important;
          }
          .invoice-items-table th,
          .invoice-items-table td {
            padding: 10px 10px !important;
            font-size: 13px !important;
          }
          .invoice-items-table th:nth-child(3),
          .invoice-items-table td:nth-child(3) {
            display: table-cell !important;
            visibility: visible !important;
          }
        }
      `}</style>

      {/* ── Breadcrumb ── */}
      <div className="no-print">
        <Link
          to={isDevis ? '/devis' : '/factures'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9B9891', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#111110'}
          onMouseLeave={e => e.currentTarget.style.color = '#9B9891'}
        >
          <ArrowLeft size={14} />Retour
        </Link>
      </div>

      {/* ── Action bar ── */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={invoice.status} />
          <span style={{ fontSize: 13, color: '#9B9891' }}>
            {invoice.number || invoice.invoice_number}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ActionBtn onClick={handleEdit}     icon={Edit}        variant="default">Modifier</ActionBtn>
          <ActionBtn onClick={handleMarkSent} icon={Send}        variant="default" disabled={updateStatus.isPending}>Marquer envoyée</ActionBtn>
          <ActionBtn onClick={handleMarkPaid} icon={CheckCircle} variant="primary" disabled={updateStatus.isPending}>Marquer payée</ActionBtn>
          <span style={{ width: 1, height: 22, background: '#ECEAE4', margin: '0 2px' }} />
          <ActionBtn onClick={handlePrint}    icon={Printer}     variant="default">Imprimer / PDF</ActionBtn>
          <ActionBtn onClick={handleDelete}   icon={Trash2}      variant="danger"  disabled={deleteInvoice.isPending}>Supprimer</ActionBtn>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PRINTABLE INVOICE DOCUMENT
      ══════════════════════════════════════════════════════ */}
      <div
        className="invoice-doc"
        style={{
          background: '#fff',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 13,
          color: '#1A1917',
          /* Screen: flat sheet look, no card/sticker/shadow */
          border: '1px solid #E4E2DC',
          borderRadius: 0,
          overflow: 'visible',
          boxShadow: 'none',
        }}
      >

        {/* ── 1. Header stripe ─────────────────────────────── */}
        <div style={{
          background: ACCENT,
          padding: `16px ${G}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
          <span style={{
            fontSize: 34, fontWeight: 800, color: '#fff',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {docLabel}
          </span>
        </div>

        {/* ── 2. Emitter (left) + Invoice meta (right) ─────── */}
        <div
          className="invoice-emitter-meta"
          style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 32,
          padding: `22px ${G} 18px`,
          borderBottom: `1.5px solid #ECEAE4`,
          alignItems: 'start',
        }}>

          {/* Left — business info block, slightly stronger */}
          <div>
            {/* Name as bold header */}
            <p style={{
              fontWeight: 800, fontSize: 14, color: '#111110',
              margin: '0 0 6px', letterSpacing: '0.01em',
              textTransform: 'uppercase',
            }}>
              SAAD EDDINE KARIM
            </p>
            {/* ICE on its own line, prominent */}
            <p style={{
              margin: '0 0 6px', fontSize: 11, color: '#6B6860',
              display: 'flex', alignItems: 'baseline', gap: 6,
            }}>
              <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 10, color: '#9B9891' }}>ICE</span>
              <span style={{ ...NUM, fontSize: 12, color: '#3D3C3A', fontWeight: 600 }}>003620072000106</span>
            </p>
            {/* Address lines compact */}
            <p style={{ margin: '0 0 1px', fontSize: 11.5, color: '#6B6860', lineHeight: 1.6 }}>
              PALM ZENATA IMMEUBLE B NR 36 ZENATA CASABLANCA
            </p>
            {/* Contact row */}
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#6B6860', display: 'flex', gap: 14 }}>
              <span>06 61 94 90 01</span>
              <span style={{ color: ACCENT }}>saadinek@gmail.com</span>
            </p>
          </div>

          {/* Right — invoice meta table, right-aligned */}
          <div>
            <table style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
              <tbody>
                {[
                  { label: 'N° de facture', value: invoice.number || invoice.invoice_number || '—', bold: true },
                  { label: 'Date d\'émission', value: formatDate(invoice.issue_date || invoice.invoice_date) },
                  ...(invoice.due_date ? [{ label: 'Date d\'échéance', value: formatDate(invoice.due_date) }] : []),
                ].map(({ label, value, bold }) => (
                  <tr key={label}>
                    <td style={{
                      fontSize: 11, color: '#9B9891', fontWeight: 500,
                      paddingRight: 12, paddingBottom: 5,
                      textAlign: 'right', whiteSpace: 'nowrap',
                      letterSpacing: '0.02em',
                    }}>
                      {label}
                    </td>
                    <td style={{
                      paddingBottom: 5,
                      ...NUM, fontSize: 13,
                      fontWeight: bold ? 700 : 600,
                      color: bold ? '#111110' : '#3D3C3A',
                      whiteSpace: 'nowrap',
                    }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 3. Client block — left-border accent, no background box ── */}
        <div style={{
          margin: `16px ${G} 18px`,
          padding: '12px 16px',
          borderLeft: `3px solid ${ACCENT}`,
          background: '#FAFAF8',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#9B9891', margin: '0 0 6px',
          }}>
            Facturé à
          </p>
          {client ? (
            <div className="invoice-client-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 32, rowGap: 2 }}>
              {/* Client name — full width */}
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111110', margin: 0, gridColumn: '1 / -1', marginBottom: 5 }}>
                {client.name || client.company || '—'}
              </p>
              {/* Fields in two-column layout for compactness */}
              {client.company && client.name && (
                <>
                  <span style={{ fontSize: 11, color: '#9B9891', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Société</span>
                  <span style={{ fontSize: 12, color: '#3D3C3A' }}>{client.company}</span>
                </>
              )}
              {client.ice && (
                <>
                  <span style={{ fontSize: 11, color: '#9B9891', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>ICE</span>
                  <span style={{ ...NUM, fontSize: 12, color: '#3D3C3A' }}>{client.ice}</span>
                </>
              )}
              {client.address && (
                <>
                  <span style={{ fontSize: 11, color: '#9B9891', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Adresse</span>
                  <span style={{ fontSize: 12, color: '#3D3C3A' }}>{client.address}</span>
                </>
              )}
              {client.email && (
                <>
                  <span style={{ fontSize: 11, color: '#9B9891', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email</span>
                  <span style={{ fontSize: 12, color: '#3D3C3A' }}>{client.email}</span>
                </>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#B0ADA8', fontStyle: 'italic', margin: 0 }}>
              Aucun client associé
            </p>
          )}
        </div>

        {/* ── 4. Line items table ───────────────────────────── */}
        <div style={{ padding: `0 ${G}` }}>
          <table className="invoice-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: ACCENT }}>
                {[
                  { label: 'Qté',           align: 'center', w: '52px'  },
                  { label: 'Description',   align: 'left',   w: 'auto'  },
                  { label: 'Prix unit. HT', align: 'right',  w: '110px' },
                  { label: 'Total HT',      align: 'right',  w: '110px' },
                ].map(col => (
                  <th key={col.label} style={{
                    padding: '9px 10px',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: '#fff', textAlign: col.align,
                    width: col.w, border: 'none',
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{
                    padding: '18px 10px', textAlign: 'center',
                    fontSize: 12, color: '#B0ADA8', fontStyle: 'italic',
                    borderBottom: '1px solid #ECEAE4',
                  }}>
                    Aucune ligne.
                  </td>
                </tr>
              ) : items.map((item, idx) => {
                const lineTotal = Number(item.quantity) * Number(item.unit_price)
                const isOdd     = idx % 2 === 1
                return (
                  <tr key={item.id ?? idx} style={{ background: isOdd ? '#FDF9F5' : '#fff' }}>
                    <td style={{ padding: '10px 10px', textAlign: 'center', borderBottom: '1px solid #F0EEE9', ...NUM, fontSize: 13, color: '#3D3C3A' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #F0EEE9', fontSize: 12.5, color: '#111110', lineHeight: 1.55 }}>
                      {item.description}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', borderBottom: '1px solid #F0EEE9', ...NUM, fontSize: 13, color: '#555250' }}>
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', borderBottom: '1px solid #F0EEE9', ...NUM, fontSize: 13, fontWeight: 600, color: '#111110' }}>
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── 5. Totals block ───────────────────────────────── */}
        <div style={{ padding: `10px ${G} 18px`, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 260 }}>

            {/* Sous-total row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #ECEAE4' }}>
              <span style={{ fontSize: 12, color: '#6B6860' }}>Sous-total HT</span>
              <span style={{ ...NUM, fontSize: 13, color: '#3D3C3A' }}>{formatCurrency(subtotal)}</span>
            </div>

            {/* TVA row */}
            {taxRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #F5F4F1' }}>
                <span style={{ fontSize: 12, color: '#6B6860' }}>TVA ({taxRate}%)</span>
                <span style={{ ...NUM, fontSize: 13, color: '#3D3C3A' }}>{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {/* TOTAL — premium orange bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: ACCENT, padding: '10px 14px', marginTop: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Total TTC
              </span>
              <span style={{ ...NUM, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── 6. Amount in words ────────────────────────────── */}
        <div style={{
          margin: `0 ${G} 16px`,
          padding: '10px 14px',
          background: '#F8F6F2',
          borderLeft: '3px solid #D0CEC7',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#9B9891', marginRight: 8,
          }}>
            Arrêté la présente facture à la somme de :
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3D3C3A', fontStyle: 'italic' }}>
            {totalWords}
          </span>
        </div>

        {/* ── Notes ─────────────────────────────────────────── */}
        {invoice.notes && (
          <div style={{ margin: `0 ${G} 16px` }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9B9891', marginBottom: 4 }}>
              Notes
            </p>
            <p style={{ fontSize: 12, color: '#6B6860', whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: 0 }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {/* ── 7. Footer: thank-you + signature ─────────────── */}
        <div style={{
          padding: `16px ${G} 28px`,
          borderTop: '1px solid #ECEAE4',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: 4,
        }}>
          {/* Thank-you */}
          <p style={{
            fontSize: 11, color: ACCENT, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
          }}>
            {invoice.profiles?.full_name || 'SAAD EDDINE KARIM'} VOUS REMERCIE POUR VOTRE CONFIANCE
          </p>

          {/* Signature */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              width: 160, height: 44,
              borderBottom: '1.5px solid #3D3C3A',
              marginBottom: 5, marginLeft: 'auto',
            }} />
            <p style={{ fontSize: 10.5, color: '#9B9891', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Signature &amp; Cachet
            </p>
          </div>
        </div>

      </div>
      {/* end .invoice-doc */}

    </div>
  )
}
