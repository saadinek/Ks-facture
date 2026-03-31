import { create }   from 'zustand'
import { supabase } from '../services/supabase.js'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  session: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false })
      if (session?.user) get()._loadProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) get()._loadProfile(session.user.id)
      else set({ profile: null })
    })

    return () => subscription.unsubscribe()
  },

  _loadProfile: async (uid) => {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', uid).single()
    set({ profile: data ?? null })
  },

  patchProfile: (updates) =>
    set(s => ({ profile: s.profile ? { ...s.profile, ...updates } : updates })),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },
}))
