import { useEffect }                              from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider }        from '@tanstack/react-query'

import { useAuthStore }              from './store/authStore.js'
import { AppLayout, ProtectedRoute } from './components/ui.jsx'

import Login         from './pages/Login.jsx'
import Register      from './pages/Register.jsx'
import Dashboard     from './pages/Dashboard.jsx'
import Clients       from './pages/Clients.jsx'
import ClientDetail  from './pages/ClientDetail.jsx'
import Invoices      from './pages/Invoices.jsx'
import InvoiceDetail from './pages/InvoiceDetail.jsx'
import InvoiceForm   from './pages/InvoiceForm.jsx'
import Settings      from './pages/Settings.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            120_000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => {
    const unsubscribe = init()
    return unsubscribe
  }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* ── Publiques ─────────────────────────────── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protégées (sidebar + layout) ──────────── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="clients"    element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />

            <Route path="devis"              element={<Invoices type="devis" />} />
            <Route path="devis/nouveau"      element={<InvoiceForm type="devis" />} />
            <Route path="devis/:id"          element={<InvoiceDetail />} />
            <Route path="devis/:id/modifier" element={<InvoiceForm type="devis" edit />} />

            <Route path="factures"               element={<Invoices type="facture" />} />
            <Route path="factures/nouvelle"      element={<InvoiceForm type="facture" />} />
            <Route path="factures/:id"           element={<InvoiceDetail />} />
            <Route path="factures/:id/modifier"  element={<InvoiceForm type="facture" edit />} />

            <Route path="settings" element={<Settings />} />
          </Route>

          {/* ── Fallback ──────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
