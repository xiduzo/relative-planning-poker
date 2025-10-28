/**
 * Simplified Zustand store for managing planning session state
 * Now acts as a thin wrapper around TanStack Query
 */

import { create } from 'zustand'

export interface PlanningStore {
  // State
  currentSession: string | null

  // Session actions (now just setters for UI state)
  setCurrentSession: (code: string) => void
  clearSession: () => void
}

export const usePlanningStore = create<PlanningStore>()(set => ({
  currentSession: null,
  setCurrentSession: code => set({ currentSession: code }),
  clearSession: () => set({ currentSession: null }),
}))
