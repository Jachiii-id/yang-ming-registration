import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [doneFor, setDoneFor] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) { setProfile(null); setDoneFor(null); return }
    let live = true
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => {
      if (live) { setProfile(data); setDoneFor(uid) }
    })
    return () => { live = false }
  }, [uid])

  const loading = !ready || (!!uid && doneFor !== uid)
  const signOut = () => supabase.auth.signOut()
  return <Ctx.Provider value={{ session, user: session?.user, profile, loading, isAdmin: profile?.role === 'admin', signOut }}>{children}</Ctx.Provider>
}
