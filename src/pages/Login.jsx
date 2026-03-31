// Imports relatifs :
//   ../components/ui.jsx
//   ../services/invoiceService.js

import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Zap }   from 'lucide-react'
import { Btn, Field }        from '../components/ui.jsx'
import { authService }       from '../services/invoiceService.js'

export default function Login() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    setError(null)
  }

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.login(form)
      navigate('/')
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-semibold text-xl text-[#1A1917]">Fakturo</span>
        </div>

        <h1 className="text-2xl font-semibold text-[#1A1917] mb-1">Bon retour 👋</h1>
        <p className="text-sm text-[#6B6860] mb-7">
          Connecte-toi pour accéder à ton espace.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            icon={Mail}
            placeholder="toi@exemple.com"
            required
            autoComplete="email"
          />
          <Field
            label="Mot de passe"
            type="password"
            value={form.password}
            onChange={set('password')}
            icon={Lock}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Btn type="submit" size="lg" className="w-full" loading={loading}>
            Se connecter
          </Btn>
        </form>

        <p className="text-center text-sm text-[#A8A5A0] mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-[#2563EB] font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
