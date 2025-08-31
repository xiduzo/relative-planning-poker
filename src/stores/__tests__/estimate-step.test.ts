import { describe, it, expect, beforeEach } from 'vitest'
import { usePlanningStore } from '../planning-store'
import { createTestSession, createTestStory } from '../../test/utils'
import { FIBONACCI_NUMBERS, FibonacciNumber } from '@/types'
import { ZodError } from 'zod'

describe('Estimate Step', () => {
  beforeEach(() => {
    usePlanningStore.setState({ currentSession: null, sessions: {} })
  })

  describe('setAnchorStoryPoints', () => {
    it('should set valid Fibonacci story points', () => {
      const session = createTestSession()
      usePlanningStore.setState({ currentSession: session })

      const store = usePlanningStore.getState()
      store.setAnchorStoryPoints(8)

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.anchorStoryPoints).toBe(8)
    })

    it('should set null story points', () => {
      const session = createTestSession({
        anchorStoryPoints: 8,
      })
      usePlanningStore.setState({ currentSession: session })

      const store = usePlanningStore.getState()
      store.setAnchorStoryPoints(null)

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.anchorStoryPoints).toBe(null)
    })

    it('should throw error for invalid Fibonacci number', () => {
      const session = createTestSession()
      usePlanningStore.setState({ currentSession: session })

      const store = usePlanningStore.getState()

      expect(() => {
        store.setAnchorStoryPoints(7 as FibonacciNumber) // 7 is not a Fibonacci number
      }).toThrow(expect.any(ZodError))
    })

    it('should accept all valid Fibonacci numbers', () => {
      const session = createTestSession()
      usePlanningStore.setState({ currentSession: session })

      const store = usePlanningStore.getState()

      FIBONACCI_NUMBERS.forEach(number => {
        expect(() => {
          store.setAnchorStoryPoints(number)
        }).not.toThrow()
      })
    })
  })

  describe('estimate step initialization', () => {
    it('should create session with default estimate step', () => {
      const store = usePlanningStore.getState()
      store.createSession('Test Session', 'ABC123')

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.anchorStoryPoints).toBeNull()
    })
  })
})
