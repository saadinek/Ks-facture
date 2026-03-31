import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    '❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant.\n' +
    'Crée un fichier .env.local à la racine du projet.'
  )
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
