// Imports relatifs :
//   ../components/ui.jsx
//   ../services/invoiceService.js

import { useState }                         from 'react'
import { Link, useNavigate }                from 'react-router-dom'
import { Mail, Lock, User, Briefcase, Zap } from 'lucide-react'
import { Btn, Field }                       from '../components/ui.jsx'
import { authService }                      from '../services/invoiceService.js'

export default function Register() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ fullName: '', company: '', email: '', password: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    setError(null)
  }

  const submit = async e => {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setLoading(true)
    try {
      await authService.register(form)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center fade-up">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4 text-3xl">
            ✉️
          </div>
          <h2 className="text-xl font-semibold text-[#1A1917] mb-2">Vérifie ton email</h2>
          <p className="text-sm text-[#6B6860] mb-6">
            Un lien de confirmation a été envoyé à{' '}
            <strong>{form.email}</strong>.
          </p>
          <Btn variant="secondary" onClick={() => navigate('/login')} className="w-full" size="lg">
            Retour à la connexion
          </Btn>
        </div>
      </div>
    )
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

        <h1 className="text-2xl font-semibold text-[#1A1917] mb-1">Créer ton compte</h1>
        <p className="text-sm text-[#6B6860] mb-7">
          Commence à facturer en quelques secondes.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Nom complet"
            value={form.fullName}
            onChange={set('fullName')}
            icon={User}
            placeholder="Haytam Benali"
            required
          />
          <Field
            label="Entreprise (optionnel)"
            value={form.company}
            onChange={set('company')}
            icon={Briefcase}
            placeholder="Mon auto-entreprise"
          />
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
            placeholder="6 caractères minimum"
            required
            hint="Au moins 6 caractères"
          />

          {error && (
            <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Btn type="submit" size="lg" className="w-full" loading={loading}>
            Créer mon compte
          </Btn>
        </form>

        <p className="text-center text-sm text-[#A8A5A0] mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-[#2563EB] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
