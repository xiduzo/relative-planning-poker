import { useLocalStorage } from 'usehooks-ts'
import { PlanningSession } from '@/types'

export interface RecentSession {
  code: string
  name: string
  joinedAt: Date
}

const STORAGE_KEY = 'recent-sessions'
const MAX_RECENT_SESSIONS = 3

export function useRecentSessions() {
  const [recentSessions, setRecentSessions] = useLocalStorage<RecentSession[]>(
    STORAGE_KEY,
    []
  )

  const addRecentSession = (session: PlanningSession) => {
    const newRecentSession: RecentSession = {
      code: session.code,
      name: session.name,
      joinedAt: new Date(),
    }

    setRecentSessions(prev => {
      // Remove any existing session with the same code
      const filtered = prev.filter(s => s.code !== session.code)

      // Add the new session at the beginning
      const updated = [newRecentSession, ...filtered]

      // Keep only the most recent MAX_RECENT_SESSIONS
      return updated.slice(0, MAX_RECENT_SESSIONS)
    })
  }

  const removeRecentSession = (code: string) => {
    setRecentSessions(prev => prev.filter(s => s.code !== code))
  }

  const clearRecentSessions = () => {
    setRecentSessions([])
  }

  return {
    recentSessions,
    addRecentSession,
    removeRecentSession,
    clearRecentSessions,
  }
}
