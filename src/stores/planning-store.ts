/**
 * Simplified Zustand store for managing planning session state
 * Now acts as a thin wrapper around TanStack Query
 */

import { create } from 'zustand'
import { PlanningSession } from '@/types'

export interface PlanningStore {
  // State
  currentSession: PlanningSession | null

  // Session actions (now just setters for UI state)
  setCurrentSession: (session: PlanningSession | null) => void
  clearSession: () => void
}

export const usePlanningStore = create<PlanningStore>()(set => ({
  currentSession: null,

  setCurrentSession: session => set({ currentSession: session }),
  clearSession: () => set({ currentSession: null }),
}))
