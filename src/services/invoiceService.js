import { supabase }                          from './supabase.js'
import { makeInvoiceNumber, computeTotals } from '../utils/utils.js'

// ══════════════════════════════════════════════════════════════
//  AUTH  (unchanged)
// ══════════════════════════════════════════════════════════════

export const authService = {
  register: async ({ email, password, fullName, company }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      const { error: pe } = await supabase.from('profiles').insert({
        id: data.user.id, email, full_name: fullName, company, currency: 'MAD',
      })
      if (pe) throw pe
    }
    return data
  },

  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', userId).select().single()
    if (error) throw error
    return data
  },
}

// ══════════════════════════════════════════════════════════════
//  CLIENTS  (unchanged)
// ══════════════════════════════════════════════════════════════

export const clientService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('clients').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, invoices(id, number, type, status, total, issue_date)')
      .eq('id', id).single()
    if (error) throw error
    return data
  },

  create: async (fields) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clients').insert({ ...fields, user_id: user.id }).select().single()
    if (error) throw error
    return data
  },

  update: async (id, fields) => {
    const { data, error } = await supabase
      .from('clients').update(fields).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}

// ══════════════════════════════════════════════════════════════
//  FACTURES / DEVIS  (unchanged except getStats extended)
// ══════════════════════════════════════════════════════════════

export const invoiceService = {
  getAll: async (type = null) => {
    let q = supabase
      .from('invoices')
      .select('*, clients(id, name, company)')
      .order('created_at', { ascending: false })
    if (type) q = q.eq('type', type)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(*), invoice_items(*)')
      .eq('id', id).single()
    if (error) throw error
    return data
  },

  create: async (type, fields, items = []) => {
    const { data: { user } } = await supabase.auth.getUser()

    // Sequential numbering — count existing invoices of this type
    const { count } = await supabase
      .from('invoices').select('*', { count: 'exact', head: true }).eq('type', type)
    const number = makeInvoiceNumber(type, count ?? 0)

    const { subtotal, taxAmount, total } = computeTotals(items, fields.tax_rate ?? 20)

    // Convert empty date strings to null — prevents "invalid input syntax for type date"
    const safeFields = {
      ...fields,
      issue_date:   fields.issue_date   || null,
      due_date:     fields.due_date     || null,
      invoice_date: fields.invoice_date || null,
    }

    const { data: inv, error: ie } = await supabase
      .from('invoices')
      .insert({ ...safeFields, type, number, user_id: user.id, subtotal, tax_amount: taxAmount, total })
      .select().single()
    if (ie) throw ie

    if (items.length > 0) {
      const { error: itemErr } = await supabase.from('invoice_items').insert(
        items.map(i => ({
          invoice_id:  inv.id,
          description: i.description,
          quantity:    Number(i.quantity),
          unit_price:  Number(i.unit_price),
        }))
      )
      if (itemErr) throw itemErr
    }
    return inv
  },

  update: async (id, fields, items = []) => {
    const { subtotal, taxAmount, total } = computeTotals(items, fields.tax_rate ?? 20)

    // Convert empty date strings to null — prevents "invalid input syntax for type date"
    const safeFields = {
      ...fields,
      issue_date:   fields.issue_date   || null,
      due_date:     fields.due_date     || null,
      invoice_date: fields.invoice_date || null,
    }

    const { data: inv, error: ie } = await supabase
      .from('invoices')
      .update({ ...safeFields, subtotal, tax_amount: taxAmount, total })
      .eq('id', id).select().single()
    if (ie) throw ie

    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    if (items.length > 0) {
      await supabase.from('invoice_items').insert(
        items.map(i => ({
          invoice_id:  id,
          description: i.description,
          quantity:    Number(i.quantity),
          unit_price:  Number(i.unit_price),
        }))
      )
    }
    return inv
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('invoices').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },

  getStats: async () => {
    const { data, error } = await supabase
      .from('invoices').select('type, status, total')
    if (error) throw error
    const f = (data ?? []).filter(d => d.type === 'facture')
    return {
      ca:          f.filter(x => x.status === 'paye').reduce((s, x) => s + x.total, 0),
      enAttente:   f.filter(x => x.status === 'envoye').reduce((s, x) => s + x.total, 0),
      nbFactures:  f.length,
      nbDevis:     (data ?? []).filter(d => d.type === 'devis').length,
      nbPayees:    f.filter(x => x.status === 'paye').length,
      nbEnAttente: f.filter(x => x.status === 'envoye').length,
    }
  },

  // Per-client cumulative totals — used for 80k warning
  getClientTotals: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('client_id, total, status')
      .eq('type', 'facture')
      .neq('status', 'annule')
    if (error) throw error
    const map = {}
    for (const inv of data ?? []) {
      if (!inv.client_id) continue
      map[inv.client_id] = (map[inv.client_id] ?? 0) + (inv.total ?? 0)
    }
    return map  // { [clientId]: totalAmount }
  },
}

// ══════════════════════════════════════════════════════════════
//  SERVICE TEMPLATES  (new — persisted in Supabase)
// ══════════════════════════════════════════════════════════════

export const serviceTemplateService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('service_templates')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  create: async (fields) => {
    const { data: { user } } = await supabase.auth.getUser()
    // sort_order = count of existing so it goes to the end
    const { count } = await supabase
      .from('service_templates').select('*', { count: 'exact', head: true })
    const { data, error } = await supabase
      .from('service_templates')
      .insert({
        user_id:     user.id,
        label:       fields.label.trim(),
        description: (fields.description || fields.label).trim(),
        unit_price:  Number(fields.unit_price) || 0,
        sort_order:  count ?? 0,
      })
      .select().single()
    if (error) throw error
    return data
  },

  update: async (id, fields) => {
    const { data, error } = await supabase
      .from('service_templates')
      .update({
        label:       fields.label.trim(),
        description: (fields.description || fields.label).trim(),
        unit_price:  Number(fields.unit_price) || 0,
      })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase.from('service_templates').delete().eq('id', id)
    if (error) throw error
  },
}

// ══════════════════════════════════════════════════════════════
//  EXPENSES  (new — manual expense tracking)
// ══════════════════════════════════════════════════════════════

export const expenseService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at',   { ascending: false })
    if (error) throw error
    return data ?? []
  },

  create: async (fields) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id:      user.id,
        label:        fields.label.trim(),
        amount:       Number(fields.amount) || 0,
        expense_date: fields.expense_date,
        category:     fields.category?.trim() || 'Autre',
        notes:        fields.notes?.trim() || '',
      })
      .select().single()
    if (error) throw error
    return data
  },

  update: async (id, fields) => {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        label:        fields.label.trim(),
        amount:       Number(fields.amount) || 0,
        expense_date: fields.expense_date,
        category:     fields.category?.trim() || 'Autre',
        notes:        fields.notes?.trim() || '',
      })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  },

  getTotal: async () => {
    const { data, error } = await supabase
      .from('expenses').select('amount')
    if (error) throw error
    return (data ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
  },
}
