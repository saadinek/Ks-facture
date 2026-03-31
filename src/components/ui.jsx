/**
 * ui.jsx — tous les composants partagés de l'application.
 * Imports : uniquement des chemins relatifs depuis src/components/
 */

import { useState } from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Receipt,
  Settings, LogOut, Zap, Menu, X as XIcon,
} from 'lucide-react'
import { cn, initials, STATUS_LABEL, STATUS_STYLE } from '../utils/utils.js'
import { useAuthStore }                             from '../store/authStore.js'

// ══════════════════════════════════════════════════════════════
//  BUTTON
// ══════════════════════════════════════════════════════════════

const V = {
  primary:   'bg-[#2563EB] text-white hover:bg-[#1D4ED8]',
  secondary: 'bg-white text-[#1A1917] border border-[#E8E6E0] hover:bg-[#F7F6F3]',
  ghost:     'text-[#6B6860] hover:text-[#1A1917] hover:bg-[#F7F6F3]',
  danger:    'bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 hover:bg-[#DC2626] hover:text-white',
}
const SZ = {
  sm: 'h-8  px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9  px-4 text-sm gap-2   rounded-md',
  lg: 'h-11 px-5 text-sm gap-2   rounded-lg',
}

export function Btn({
  children, variant = 'primary', size = 'md',
  loading = false, disabled, className, ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-sm',
        V[variant], SZ[size], className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════

export function Field({ label, error, hint, icon: Icon, wrap, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1', wrap)}>
      {label && (
        <label className="text-[11px] font-semibold text-[#6B6860] tracking-widest uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A5A0]" size={14} />
        )}
        <input
          className={cn(
            'w-full h-9 rounded-md border bg-white text-sm text-[#1A1917]',
            'placeholder:text-[#A8A5A0] transition-all',
            'focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]',
            error
              ? 'border-[#DC2626] focus:ring-[#DC2626]/25'
              : 'border-[#E8E6E0] hover:border-[#D0CEC7]',
            Icon ? 'pl-9 pr-3' : 'px-3'
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#A8A5A0]">{hint}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CARD
// ══════════════════════════════════════════════════════════════

export function Card({ children, className, pad = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E8E6E0] rounded-xl',
        'shadow-[0_1px_4px_rgba(0,0,0,.06)]',
        pad && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Head = function CardHead({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <p className="text-sm font-semibold text-[#1A1917]">{title}</p>
        {sub && <p className="text-xs text-[#A8A5A0] mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  BADGE (statut)
// ══════════════════════════════════════════════════════════════

export function Badge({ status, className }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.brouillon
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium', className)}
      style={{ background: s.bg, color: s.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: s.dot }}
      />
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
//  AVATAR
// ══════════════════════════════════════════════════════════════

export function Avatar({ name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={cn(
      'rounded-full bg-[#EFF4FF] text-[#2563EB] font-semibold',
      'flex items-center justify-center shrink-0', sz
    )}>
      {initials(name)}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MODAL WRAPPER
// ══════════════════════════════════════════════════════════════

export function Modal({ children, onClose, title }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E0]">
          <p className="text-sm font-semibold text-[#1A1917]">{title}</p>
          <button
            onClick={onClose}
            className="text-[#A8A5A0] hover:text-[#1A1917] text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SPINNER
// ══════════════════════════════════════════════════════════════

export function Spinner({ text = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      {text && <p className="text-sm text-[#A8A5A0]">{text}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════════════════════

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/clients',  icon: Users,           label: 'Clients'    },
  { to: '/devis',    icon: FileText,        label: 'Devis'      },
  { to: '/factures', icon: Receipt,         label: 'Factures'   },
]

// SidebarContent is the inner markup — shared between desktop
// (always visible) and mobile (shown inside a drawer overlay).
function SidebarContent({ onNavClick }) {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const doSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[#E8E6E0] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm text-[#1A1917]">KS Facture</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavClick}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group',
              isActive
                ? 'bg-[#EFF4FF] text-[#2563EB] font-medium'
                : 'text-[#6B6860] hover:text-[#1A1917] hover:bg-[#F7F6F3]'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={isActive
                    ? 'text-[#2563EB]'
                    : 'text-[#A8A5A0] group-hover:text-[#6B6860]'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E8E6E0] p-3 space-y-0.5 shrink-0">
        <NavLink
          to="/settings"
          onClick={onNavClick}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group w-full',
            isActive
              ? 'bg-[#EFF4FF] text-[#2563EB] font-medium'
              : 'text-[#6B6860] hover:text-[#1A1917] hover:bg-[#F7F6F3]'
          )}
        >
          {({ isActive }) => (
            <>
              <Settings size={16} className={isActive ? 'text-[#2563EB]' : 'text-[#A8A5A0] group-hover:text-[#6B6860]'} />
              Paramètres
            </>
          )}
        </NavLink>

        {/* Profil */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <Avatar name={profile?.full_name ?? profile?.email ?? '?'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1A1917] truncate">
              {profile?.full_name ?? 'Mon compte'}
            </p>
            <p className="text-[11px] text-[#A8A5A0] truncate">
              {profile?.company ?? profile?.email ?? ''}
            </p>
          </div>
        </div>

        <button
          onClick={doSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#A8A5A0] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all w-full"
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-[#E8E6E0]">
      <SidebarContent onNavClick={undefined} />
    </aside>
  )
}

// ══════════════════════════════════════════════════════════════
//  APP LAYOUT  — responsive: sidebar on desktop, drawer on mobile
// ══════════════════════════════════════════════════════════════

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F6F3]">

      {/* ── Desktop sidebar — hidden on mobile ── */}
      <aside className="hidden md:flex w-56 shrink-0 h-screen sticky top-0 flex-col bg-white border-r border-[#E8E6E0]">
        <SidebarContent onNavClick={undefined} />
      </aside>

      {/* ── Mobile: backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8E6E0]',
          'transform transition-transform duration-250 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button inside drawer */}
        <button
          onClick={close}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-[#A8A5A0] hover:text-[#1A1917] hover:bg-[#F7F6F3] transition-colors"
          aria-label="Fermer le menu"
        >
          <XIcon size={18} />
        </button>
        <SidebarContent onNavClick={close} />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto min-w-0">

        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-[#E8E6E0] sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6B6860] hover:bg-[#F7F6F3] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-[#1A1917]">KS Facture</span>
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  PROTECTED ROUTE
// ══════════════════════════════════════════════════════════════

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F6F3]">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}
