// Imports relatifs :
//   ../components/ui.jsx
//   ../hooks/useData.js
//   ../utils/utils.js

import { useState }                      from 'react'
import { useParams, Link, useNavigate }  from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Hash,
  Building2, Edit2, Trash2, Plus, Receipt, FileText,
} from 'lucide-react'
import { Card, Badge, Btn, Field, Modal, Avatar, Spinner } from '../components/ui.jsx'
import { useClient, useUpdateClient, useDeleteClient }     from '../hooks/useData.js'
import { formatCurrency, formatDate }                      from '../utils/utils.js'

// ── Info row ─────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-[#A8A5A0] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-[#A8A5A0]">{label}</p>
        <p className="text-sm text-[#1A1917]">{value}</p>
      </div>
    </div>
  )
}

// ── Modal édition ─────────────────────────────────────────────

function EditModal({ client, onClose }) {
  const update = useUpdateClient()
  const [f, setF]   = useState({ ...client })
  const [err, setErr] = useState(null)

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    try {
      await update.mutateAsync({ id: client.id, ...f })
      onClose()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <Modal title={`Modifier ${client.name}`} onClose={onClose}>
      <form onSubmit={submit} className="px-6 py-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom *"      value={f.name    ?? ''} onChange={set('name')}    wrap="col-span-2" />
          <Field label="Entreprise" value={f.company ?? ''} onChange={set('company')} />
          <Field label="ICE"        value={f.ice     ?? ''} onChange={set('ice')} />
          <Field label="Email"  type="email" value={f.email   ?? ''} onChange={set('email')} />
          <Field label="Téléphone"  value={f.phone   ?? ''} onChange={set('phone')} />
          <Field label="Adresse"    value={f.address ?? ''} onChange={set('address')} wrap="col-span-2" />
        </div>
        {err && <p className="text-xs text-[#DC2626]">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="secondary" type="button" onClick={onClose}>Annuler</Btn>
          <Btn type="submit" loading={update.isPending}>Enregistrer</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function ClientDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const { data: client, isLoading } = useClient(id)
  const del     = useDeleteClient()
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${client.name}" ? Cette action est irréversible.`)) return
    await del.mutateAsync(id)
    navigate('/clients')
  }

  if (isLoading) return <Spinner />
  if (!client) return (
    <div className="text-center py-24">
      <p className="text-sm text-[#A8A5A0]">Client introuvable.</p>
      <Link to="/clients">
        <Btn variant="secondary" size="sm" className="mt-3">
          <ArrowLeft size={13} />Retour
        </Btn>
      </Link>
    </div>
  )

  const invoices = client.invoices ?? []
  const ca       = invoices
    .filter(i => i.status === 'paye')
    .reduce((s, i) => s + (i.total ?? 0), 0)

  return (
    <div className="space-y-6 stagger">

      {/* Breadcrumb */}
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-[#A8A5A0] hover:text-[#1A1917] transition-colors"
      >
        <ArrowLeft size={14} />Clients
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar name={client.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[#1A1917]">{client.name}</h1>
          {client.company && (
            <p className="text-sm text-[#A8A5A0] flex items-center gap-1 mt-0.5">
              <Building2 size={13} />{client.company}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Edit2 size={13} />Modifier
          </Btn>
          <Btn variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={13} />
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Fiche */}
        <Card className="col-span-1 space-y-4">
          <Card.Head title="Informations" />
          <InfoRow icon={Mail}   label="Email"     value={client.email}   />
          <InfoRow icon={Phone}  label="Téléphone" value={client.phone}   />
          <InfoRow icon={MapPin} label="Adresse"   value={client.address} />
          <InfoRow icon={Hash}   label="ICE"       value={client.ice}     />
        </Card>

        {/* Activité */}
        <div className="col-span-2 space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'CA réalisé', value: formatCurrency(ca) },
              { label: 'Factures',   value: invoices.filter(i => i.type === 'facture').length },
              { label: 'Devis',      value: invoices.filter(i => i.type === 'devis').length },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center py-3">
                <p className="text-lg font-semibold text-[#1A1917]">{value}</p>
                <p className="text-xs text-[#A8A5A0] mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          {/* Historique */}
          <Card pad={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E0]">
              <p className="text-sm font-semibold text-[#1A1917]">Historique</p>
              <Link to={`/factures/nouvelle?client=${id}`}>
                <Btn size="sm"><Plus size={13} />Nouvelle facture</Btn>
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className="py-10 text-center">
                <Receipt size={22} className="text-[#D0CEC7] mx-auto mb-2" />
                <p className="text-sm text-[#A8A5A0]">Aucun document pour ce client.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E6E0]">
                {invoices.map(inv => (
                  <Link
                    key={inv.id}
                    to={`/${inv.type === 'facture' ? 'factures' : 'devis'}/${inv.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-[#F7F6F3] transition-colors"
                  >
                    <FileText size={13} className="text-[#A8A5A0] shrink-0" />
                    <span className="font-mono text-xs text-[#A8A5A0] w-28 shrink-0">
                      {inv.number}
                    </span>
                    <span className="flex-1 text-xs text-[#A8A5A0] capitalize">{inv.type}</span>
                    <span className="text-xs text-[#A8A5A0]">{formatDate(inv.issue_date)}</span>
                    <span className="text-sm font-medium text-[#1A1917]">
                      {formatCurrency(inv.total)}
                    </span>
                    <Badge status={inv.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {editing && <EditModal client={client} onClose={() => setEditing(false)} />}
    </div>
  )
}
