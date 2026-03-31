import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clientService,
  invoiceService,
  serviceTemplateService,
  expenseService,
} from '../services/invoiceService.js'

// ── Clients (unchanged) ───────────────────────────────────────

export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: clientService.getAll })
}

export function useClient(id) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn:  () => clientService.getById(id),
    enabled:  !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clientService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...rest }) => clientService.update(id, rest),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients', id] })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clientService.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

// ── Invoices (unchanged) ──────────────────────────────────────

export function useInvoices(type = null) {
  return useQuery({
    queryKey: ['invoices', type],
    queryFn:  () => invoiceService.getAll(type),
  })
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn:  () => invoiceService.getById(id),
    enabled:  !!id,
  })
}

export function useInvoiceStats() {
  return useQuery({ queryKey: ['invoices', 'stats'], queryFn: invoiceService.getStats })
}

export function useUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => invoiceService.updateStatus(id, status),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['clientTotals'] })
    },
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceService.delete,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['clientTotals'] })
    },
  })
}

// ── Client totals — for 80k warning (new) ────────────────────
// Returns { [clientId]: totalAmount } for non-cancelled factures

export function useClientTotals() {
  return useQuery({
    queryKey: ['clientTotals'],
    queryFn:  invoiceService.getClientTotals,
  })
}

// ── Service templates — Supabase-backed (new) ─────────────────

export function useServiceTemplates() {
  return useQuery({
    queryKey: ['serviceTemplates'],
    queryFn:  serviceTemplateService.getAll,
  })
}

export function useCreateServiceTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: serviceTemplateService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['serviceTemplates'] }),
  })
}

export function useUpdateServiceTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...fields }) => serviceTemplateService.update(id, fields),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['serviceTemplates'] }),
  })
}

export function useDeleteServiceTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: serviceTemplateService.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['serviceTemplates'] }),
  })
}

// ── Expenses (new) ────────────────────────────────────────────

export function useExpenses() {
  return useQuery({ queryKey: ['expenses'], queryFn: expenseService.getAll })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: expenseService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...fields }) => expenseService.update(id, fields),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: expenseService.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}
