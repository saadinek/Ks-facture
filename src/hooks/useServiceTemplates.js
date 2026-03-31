// useServiceTemplates.js
// ─────────────────────────────────────────────────────────────
// Thin compatibility shim.
// Previously this hook used localStorage directly.
// Now it re-exports the Supabase-backed hooks from useData.js
// so that Settings.jsx and InvoiceForm.jsx don't need rewrites.
//
// Consumers that previously did:
//   const { templates, addTemplate, updateTemplate, deleteTemplate } = useServiceTemplates()
//
// Now get:
//   templates       — from useQuery(['serviceTemplates'])
//   addTemplate     — wraps useCreateServiceTemplate mutateAsync
//   updateTemplate  — wraps useUpdateServiceTemplate mutateAsync
//   deleteTemplate  — wraps useDeleteServiceTemplate mutateAsync
// ─────────────────────────────────────────────────────────────

export {
  useServiceTemplates,
  useCreateServiceTemplate,
  useUpdateServiceTemplate,
  useDeleteServiceTemplate,
} from './useData.js'
