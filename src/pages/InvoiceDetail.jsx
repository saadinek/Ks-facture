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

function makePdfFilename(invoice) {
  const rawName  = invoice.clients?.name || invoice.clients?.company || 'Client'
  const rawDate  = invoice.issue_date   || invoice.invoice_date      || ''

  const safeName = rawName
    .trim()
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .toUpperCase()

  const safeDate = rawDate.slice(0, 10)

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

  const handlePrint = () => {
    const filename  = makePdfFilename(invoice)
    const prevTitle = document.title
    document.title  = filename

    // On iOS (iPhone/iPad), the print engine uses the screen viewport as its
    // render width — setting width=210mm in CSS is ignored.  Widening the
    // viewport to 794px (A4 @ 96 dpi) before print() forces iOS to render
    // the invoice at full A4 width and then scale it onto the paper, which
    // eliminates right-side clipping.  We restore the viewport afterwards.
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    const prevViewport = viewportMeta ? viewportMeta.content : null
    const isMobile     = window.innerWidth < 900

    const restore = () => {
      document.title = prevTitle
      if (isMobile && viewportMeta && prevViewport !== null) {
        viewportMeta.content = prevViewport
      }
    }

    if (isMobile && viewportMeta) {
      viewportMeta.content = 'width=794, initial-scale=1, shrink-to-fit=no'
      // Wait for the browser to reflow at the new viewport before printing
      setTimeout(() => { window.print(); setTimeout(restore, 1000) }, 400)
    } else {
      window.print()
      setTimeout(restore, 500)
    }
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
  // Desktop gutter — used by both screen (.invoice-doc) and print (.invoice-print)
  const G = '36px'

  // ── Invoice body — shared between screen and print wrappers ──
  // Stored as a JSX variable to avoid duplicating markup.
  // Screen (.invoice-doc) has mobile CSS scoped under it.
  // Print (.invoice-print) is never touched by mobile CSS → always renders as desktop.
  const invoiceBody = (
    <>
      {/* ── 1. Header stripe ─────────────────────────────── */}
      <div className="inv-header" style={{
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
        className="inv-emitter"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 32,
          padding: `22px ${G} 18px`,
          borderBottom: '1.5px solid #ECEAE4',
          alignItems: 'start',
        }}
      >
        {/* Left — business info */}
        <div>
          <p style={{
            fontWeight: 800, fontSize: 14, color: '#111110',
            margin: '0 0 6px', letterSpacing: '0.01em',
            textTransform: 'uppercase',
          }}>
            SAAD EDDINE KARIM
          </p>
          <p style={{
            margin: '0 0 6px', fontSize: 11, color: '#6B6860',
            display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 10, color: '#9B9891' }}>ICE</span>
            <span style={{ ...NUM, fontSize: 12, color: '#3D3C3A', fontWeight: 600 }}>003620072000106</span>
          </p>
          <p style={{ margin: '0 0 1px', fontSize: 11.5, color: '#6B6860', lineHeight: 1.6 }}>
            PALM ZENATA IMMEUBLE B NR 36 ZENATA CASABLANCA
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#6B6860', display: 'flex', gap: 14 }}>
            <span>06 61 94 90 01</span>
            <span style={{ color: ACCENT }}>saadinek@gmail.com</span>
          </p>
        </div>

        {/* Right — invoice meta table */}
        <div>
          <table style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
            <tbody>
              {[
                { label: 'N° de facture',   value: invoice.number || invoice.invoice_number || '—', bold: true },
                { label: "Date d'émission", value: formatDate(invoice.issue_date || invoice.invoice_date) },
                ...(invoice.due_date ? [{ label: "Date d'échéance", value: formatDate(invoice.due_date) }] : []),
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

      {/* ── 3. Client block ───────────────────────────────── */}
      <div className="inv-client" style={{
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
          <div className="inv-client-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 32, rowGap: 2 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#111110', margin: 0, gridColumn: '1 / -1', marginBottom: 5 }}>
              {client.name || client.company || '—'}
            </p>
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
      <div className="inv-items-wrap" style={{ padding: `0 ${G}` }}>
        <table className="inv-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
      <div className="inv-totals-wrap" style={{ padding: `10px ${G} 18px`, display: 'flex', justifyContent: 'flex-end' }}>
        <div className="inv-totals-inner" style={{ minWidth: 260 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #ECEAE4' }}>
            <span style={{ fontSize: 12, color: '#6B6860' }}>Sous-total HT</span>
            <span style={{ ...NUM, fontSize: 13, color: '#3D3C3A' }}>{formatCurrency(subtotal)}</span>
          </div>

          {taxRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #F5F4F1' }}>
              <span style={{ fontSize: 12, color: '#6B6860' }}>TVA ({taxRate}%)</span>
              <span style={{ ...NUM, fontSize: 13, color: '#3D3C3A' }}>{formatCurrency(taxAmount)}</span>
            </div>
          )}

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
      <div className="inv-amount-words" style={{
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
        <div className="inv-notes" style={{ margin: `0 ${G} 16px` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9B9891', marginBottom: 4 }}>
            Notes
          </p>
          <p style={{ fontSize: 12, color: '#6B6860', whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: 0 }}>
            {invoice.notes}
          </p>
        </div>
      )}

      {/* ── 7. Footer: thank-you + signature ─────────────── */}
      <div className="inv-footer" style={{
        padding: `16px ${G} 28px`,
        borderTop: '1px solid #ECEAE4',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 4,
      }}>
        <p className="inv-footer-text" style={{
          fontSize: 11, color: ACCENT, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
        }}>
          {invoice.profiles?.full_name || 'SAAD EDDINE KARIM'} VOUS REMERCIE POUR VOTRE CONFIANCE
        </p>

        <div className="inv-signature" style={{ textAlign: 'right' }}>
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
    </>
  )

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Styles ─────────────────────────────────────────────
          Two wrappers:
            .invoice-doc  — screen only (responsive, mobile-adaptive)
            .invoice-print — print/PDF only (always A4 desktop layout)

          Mobile CSS is scoped under ".invoice-doc" so it never
          affects .invoice-print. Print CSS only targets .invoice-print,
          so zero mobile-override "undo" work is needed.
      ─────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        /* @page at top level so mobile browsers (Chrome Android,
           Safari iOS) respect it. margin:0 removes browser headers/footers. */
        @page {
          size: A4 portrait;
          margin: 0;
        }

        /* ── Screen wrapper — responsive ── */
        .invoice-doc {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          box-sizing: border-box;
          overflow-x: hidden;
          background: #fff;
          border: 1px solid #E4E2DC;
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 13px;
          color: #1A1917;
        }

        /* ── Print wrapper — always hidden on screen ── */
        .invoice-print {
          display: none;
        }

        /* ── Mobile: only affects .invoice-doc (scoped) ── */
        @media (max-width: 767px) {
          .invoice-doc .inv-header {
            padding: 12px 16px !important;
          }
          .invoice-doc .inv-emitter {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            padding: 16px 16px 14px !important;
          }
          .invoice-doc .inv-emitter > *:last-child {
            text-align: left !important;
          }
          .invoice-doc .inv-emitter table {
            margin-left: 0 !important;
            text-align: left !important;
          }
          .invoice-doc .inv-emitter table td {
            text-align: left !important;
            white-space: normal !important;
          }
          .invoice-doc .inv-emitter table td:first-child {
            padding-right: 8px !important;
          }
          .invoice-doc .inv-client {
            margin: 10px 16px 14px !important;
          }
          .invoice-doc .inv-client-grid {
            grid-template-columns: 1fr !important;
          }
          .invoice-doc .inv-items-wrap {
            padding: 0 10px !important;
          }
          .invoice-doc .inv-items-table {
            table-layout: fixed !important;
          }
          .invoice-doc .inv-items-table th,
          .invoice-doc .inv-items-table td {
            padding: 7px 6px !important;
            font-size: 11px !important;
          }
          .invoice-doc .inv-items-table th:nth-child(1),
          .invoice-doc .inv-items-table td:nth-child(1) {
            width: 32px !important;
          }
          .invoice-doc .inv-items-table th:nth-child(3),
          .invoice-doc .inv-items-table td:nth-child(3) {
            display: none !important;
          }
          .invoice-doc .inv-items-table th:nth-child(4),
          .invoice-doc .inv-items-table td:nth-child(4) {
            width: 80px !important;
          }
          .invoice-doc .inv-totals-wrap {
            padding: 8px 16px 14px !important;
          }
          .invoice-doc .inv-totals-inner {
            min-width: unset !important;
            width: 100% !important;
          }
          .invoice-doc .inv-amount-words {
            margin: 0 16px 12px !important;
          }
          .invoice-doc .inv-notes {
            margin: 0 16px 12px !important;
          }
          .invoice-doc .inv-footer {
            padding: 14px 16px 22px !important;
            flex-direction: column !important;
            gap: 14px !important;
            align-items: flex-start !important;
          }
          .invoice-doc .inv-footer-text {
            font-size: 9.5px !important;
          }
          .invoice-doc .inv-signature {
            text-align: left !important;
          }
          .invoice-doc .inv-signature > div:first-child {
            margin-left: 0 !important;
          }
        }

        /* ── Print: show .invoice-print as a full-page layout ──
           Strategy: we widen the viewport to 794px via JS before
           window.print() on mobile, so "width: 100%" here = A4 width.
           On desktop the viewport is already wide enough.
           position: absolute (not fixed) works more reliably on iOS WebKit.
        ── */
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything, then reveal only the print wrapper */
          body * {
            visibility: hidden !important;
          }
          .invoice-print,
          .invoice-print * {
            visibility: visible !important;
          }

          /* .invoice-doc stays hidden during print */
          .invoice-doc {
            display: none !important;
          }

          /* .invoice-print fills the full print viewport.
             On desktop that is ~794px (A4).
             On iOS we forced the viewport to 794px in JS before print(),
             so this also ends up at A4 width with no clipping. */
          .invoice-print {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            font-family: "DM Sans", system-ui, sans-serif !important;
            /* Slightly tighter base font recovers height from every text row */
            font-size: 12px !important;
            color: #1A1917 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* ── Compact vertical spacing for one-page fit ──────────
             At 78% browser scale the invoice fits → content is ~28%
             taller than A4 (exacerbated by the iOS browser URL/footer
             strip eating ~50px from the printable area).
             Target: recover ~160px of vertical space through tighter
             section padding/margins while keeping all content visible.
             Horizontal padding is untouched — no width/layout changes.
          ─────────────────────────────────────────────────────── */

          /* 1. Header stripe: reduce vertical pad + shrink FACTURE label */
          .invoice-print .inv-header {
            padding-top: 10px !important;
            padding-bottom: 10px !important;
          }
          .invoice-print .inv-header > span {
            font-size: 26px !important;
            line-height: 1 !important;
          }

          /* 2. Emitter / meta row */
          .invoice-print .inv-emitter {
            padding-top: 13px !important;
            padding-bottom: 11px !important;
          }
          .invoice-print .inv-emitter p {
            margin-bottom: 3px !important;
          }

          /* 3. Client block */
          .invoice-print .inv-client {
            margin-top: 10px !important;
            margin-bottom: 10px !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          .invoice-print .inv-client-grid {
            row-gap: 1px !important;
          }
          .invoice-print .inv-client-grid > p:first-child {
            margin-bottom: 3px !important;
          }

          /* 4. Line items: tighter rows */
          .invoice-print .inv-items-table th {
            padding-top: 7px !important;
            padding-bottom: 7px !important;
          }
          .invoice-print .inv-items-table td {
            padding-top: 7px !important;
            padding-bottom: 7px !important;
          }

          /* 5. Totals block */
          .invoice-print .inv-totals-wrap {
            padding-top: 6px !important;
            padding-bottom: 12px !important;
          }
          .invoice-print .inv-totals-inner > div {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }

          /* 6. Amount in words */
          .invoice-print .inv-amount-words {
            margin-bottom: 8px !important;
            padding-top: 7px !important;
            padding-bottom: 7px !important;
          }

          /* 7. Notes (when present) */
          .invoice-print .inv-notes {
            margin-bottom: 8px !important;
          }

          /* 8. Footer */
          .invoice-print .inv-footer {
            padding-top: 10px !important;
            padding-bottom: 14px !important;
            margin-top: 2px !important;
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

      {/* ── Screen layout (responsive) ── */}
      <div className="invoice-doc">
        {invoiceBody}
      </div>

      {/* ── Print/PDF layout (dedicated, always A4 desktop) ── */}
      <div className="invoice-print">
        {invoiceBody}
      </div>

    </div>
  )
}
