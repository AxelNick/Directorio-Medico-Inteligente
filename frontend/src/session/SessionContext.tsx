import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '../data/api'
import { service } from '../data/service'

interface SessionContextValue {
  session: Session | null
  restoring: boolean
  login: (username: string, password: string) => Promise<Session>
  logout: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)
const SESSION_KEY = 'directorio-medico-session-v1'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [restoring, setRestoring] = useState(true)
  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem(SESSION_KEY)
    if (!token) { setRestoring(false); return }
    service.resume(token).then((next) => {
      if (active) setSession(next)
    }).catch(() => {
      if (active) sessionStorage.removeItem(SESSION_KEY)
    }).finally(() => { if (active) setRestoring(false) })
    return () => { active = false }
  }, [])
  async function login(username: string, password: string) {
    const next = await service.login(username, password)
    sessionStorage.setItem(SESSION_KEY, next.token)
    setSession(next)
    return next
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }
  return <SessionContext.Provider value={{ session, restoring, login, logout }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('Falta SessionProvider')
  return value
}
