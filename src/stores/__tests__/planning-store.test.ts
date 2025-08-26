/**
 * Unit tests for PlanningStore
 */

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { usePlanningStore } from '../planning-store'
import {
  createTestStory,
  createTestSession,
  createTestPointCutoff,
} from '@/test/utils'
import type { CreateStoryInput, PointCutoff } from '@/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe(usePlanningStore.name, () => {
  beforeEach(() => {
    // Reset store state
    usePlanningStore.setState({ currentSession: null })

    // Clear localStorage mocks
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('createSession', () => {
    it('should create a new session with valid data', () => {
      const store = usePlanningStore.getState()

      store.createSession('Test Session')

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession).toBeDefined()
      expect(currentSession?.name).toBe('Test Session')
      expect(currentSession?.id).toBe('test-uuid-123')
      expect(currentSession?.stories).toEqual([])
      expect(currentSession?.anchorStoryId).toBeNull()
      expect(currentSession?.isPointAssignmentMode).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should trim session name', () => {
      const store = usePlanningStore.getState()

      store.createSession('  Test Session  ')

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.name).toBe('Test Session')
    })

    it('should throw error for invalid session data', () => {
      const store = usePlanningStore.getState()

      expect(() => store.createSession('')).toThrow()
    })
  })

  describe('loadSession', () => {
    it('should load existing session from localStorage', () => {
      const testSession = createTestSession({
        id: 'session-123',
        name: 'Loaded Session',
      })

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          'session-123': testSession,
        })
      )

      const store = usePlanningStore.getState()
      const result = store.loadSession('session-123')

      expect(result).toBe(true)
      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.id).toBe('session-123')
      expect(currentSession?.name).toBe('Loaded Session')
    })

    it('should return false for non-existent session', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({}))

      const store = usePlanningStore.getState()
      const result = store.loadSession('non-existent')

      expect(result).toBe(false)
      expect(usePlanningStore.getState().currentSession).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const store = usePlanningStore.getState()
      const result = store.loadSession('session-123')

      expect(result).toBe(false)
    })
  })

  describe('clearSession', () => {
    it('should clear current session and remove from localStorage', () => {
      const testSession = createTestSession({ id: 'session-123' })
      usePlanningStore.setState({ currentSession: testSession })

      const store = usePlanningStore.getState()
      store.clearSession()

      expect(usePlanningStore.getState().currentSession).toBeNull()
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('addStory', () => {
    beforeEach(() => {
      const testSession = createTestSession()
      usePlanningStore.setState({ currentSession: testSession })
    })

    it('should add first story as anchor', () => {
      const store = usePlanningStore.getState()
      const storyInput: CreateStoryInput = {
        title: 'First Story',
        description: 'First story description',
      }

      store.addStory(storyInput)

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories).toHaveLength(1)
      expect(currentSession?.stories[0].title).toBe('First Story')
      expect(currentSession?.stories[0].isAnchor).toBe(true)
      expect(currentSession?.anchorStoryId).toBe(currentSession?.stories[0].id)
    })

    it('should add subsequent stories as non-anchor', () => {
      const anchorStory = createTestStory({ id: 'anchor-1', isAnchor: true })
      const sessionWithAnchor = createTestSession({
        stories: [anchorStory],
        anchorStoryId: 'anchor-1',
      })
      usePlanningStore.setState({ currentSession: sessionWithAnchor })

      const store = usePlanningStore.getState()
      const storyInput: CreateStoryInput = {
        title: 'Second Story',
        description: 'Second story description',
      }

      store.addStory(storyInput)

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories).toHaveLength(2)
      expect(currentSession?.stories[1].title).toBe('Second Story')
      expect(currentSession?.stories[1].isAnchor).toBe(false)
      expect(currentSession?.anchorStoryId).toBe('anchor-1')
    })

    it('should trim story title and description', () => {
      const store = usePlanningStore.getState()
      const storyInput: CreateStoryInput = {
        title: '  Test Story  ',
        description: '  Test description  ',
      }

      store.addStory(storyInput)

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories[0].title).toBe('Test Story')
      expect(currentSession?.stories[0].description).toBe('Test description')
    })

    it('should throw error when no active session', () => {
      usePlanningStore.setState({ currentSession: null })

      const store = usePlanningStore.getState()
      const storyInput: CreateStoryInput = {
        title: 'Test Story',
        description: 'Test description',
      }

      expect(() => store.addStory(storyInput)).toThrow('No active session')
    })

    it('should validate story input', () => {
      const store = usePlanningStore.getState()
      const invalidInput: CreateStoryInput = {
        title: '', // Invalid: empty title
        description: 'Test description',
      }

      expect(() => store.addStory(invalidInput)).toThrow()
    })
  })

  describe('updateStory', () => {
    beforeEach(() => {
      const story = createTestStory({ id: 'story-1', title: 'Original Title' })
      const testSession = createTestSession({ stories: [story] })
      usePlanningStore.setState({ currentSession: testSession })
    })

    it('should update story title and description', () => {
      const store = usePlanningStore.getState()

      store.updateStory('story-1', {
        title: 'Updated Title',
        description: 'Updated description',
      })

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories[0].title).toBe('Updated Title')
      expect(currentSession?.stories[0].description).toBe('Updated description')
    })

    it('should trim updated values', () => {
      const store = usePlanningStore.getState()

      store.updateStory('story-1', {
        title: '  Updated Title  ',
        description: '  Updated description  ',
      })

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories[0].title).toBe('Updated Title')
      expect(currentSession?.stories[0].description).toBe('Updated description')
    })

    it('should throw error for non-existent story', () => {
      const store = usePlanningStore.getState()

      expect(() =>
        store.updateStory('non-existent', { title: 'New Title' })
      ).toThrow('Story not found')
    })

    it('should throw error when no active session', () => {
      usePlanningStore.setState({ currentSession: null })

      const store = usePlanningStore.getState()

      expect(() =>
        store.updateStory('story-1', { title: 'New Title' })
      ).toThrow('No active session')
    })
  })

  describe('updateStoryPosition', () => {
    beforeEach(() => {
      const story = createTestStory({ id: 'story-1', position: { x: 0, y: 0 } })
      const testSession = createTestSession({ stories: [story] })
      usePlanningStore.setState({ currentSession: testSession })
    })

    it('should update story position', () => {
      const store = usePlanningStore.getState()

      store.updateStoryPosition('story-1', { x: 50, y: 0 })

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories[0].position.x).toBe(50)
    })

    it('should normalize position to valid range', () => {
      const store = usePlanningStore.getState()

      store.updateStoryPosition('story-1', { x: 150, y: 0 }) // Above max

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories[0].position.x).toBe(100) // Normalized to max
    })

    it('should throw error for non-existent story', () => {
      const store = usePlanningStore.getState()

      expect(() =>
        store.updateStoryPosition('non-existent', { x: 50, y: 0 })
      ).toThrow('Story not found')
    })
  })

  describe('deleteStory', () => {
    it('should delete non-anchor story', () => {
      const anchorStory = createTestStory({ id: 'anchor-1', isAnchor: true })
      const regularStory = createTestStory({ id: 'story-1', isAnchor: false })
      const testSession = createTestSession({
        stories: [anchorStory, regularStory],
        anchorStoryId: 'anchor-1',
      })
      usePlanningStore.setState({ currentSession: testSession })

      const store = usePlanningStore.getState()
      store.deleteStory('story-1')

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories).toHaveLength(1)
      expect(currentSession?.stories[0].id).toBe('anchor-1')
      expect(currentSession?.anchorStoryId).toBe('anchor-1')
    })

    it('should throw error when trying to delete anchor story with other stories', () => {
      const anchorStory = createTestStory({
        id: 'anchor-1',
        isAnchor: true,
        position: { x: 0, y: 0 },
      })
      const story1 = createTestStory({
        id: 'story-1',
        isAnchor: false,
        position: { x: 10, y: 0 },
      })
      const story2 = createTestStory({
        id: 'story-2',
        isAnchor: false,
        position: { x: -5, y: 0 },
      })
      const testSession = createTestSession({
        stories: [anchorStory, story1, story2],
        anchorStoryId: 'anchor-1',
      })
      usePlanningStore.setState({ currentSession: testSession })

      const store = usePlanningStore.getState()
      
      expect(() => store.deleteStory('anchor-1')).toThrow('Cannot delete anchor story when other stories exist')
    })

    it('should clear anchor when deleting last story', () => {
      const anchorStory = createTestStory({ id: 'anchor-1', isAnchor: true })
      const testSession = createTestSession({
        stories: [anchorStory],
        anchorStoryId: 'anchor-1',
      })
      usePlanningStore.setState({ currentSession: testSession })

      const store = usePlanningStore.getState()
      store.deleteStory('anchor-1')

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.stories).toHaveLength(0)
      expect(currentSession?.anchorStoryId).toBeNull()
    })

    it('should throw error for non-existent story', () => {
      const testSession = createTestSession()
      usePlanningStore.setState({ currentSession: testSession })

      const store = usePlanningStore.getState()

      expect(() => store.deleteStory('non-existent')).toThrow('Story not found')
    })
  })

  describe('setAnchorStory', () => {
    beforeEach(() => {
      const story1 = createTestStory({ id: 'story-1', isAnchor: true })
      const story2 = createTestStory({ id: 'story-2', isAnchor: false })
      const testSession = createTestSession({
        stories: [story1, story2],
        anchorStoryId: 'story-1',
      })
      usePlanningStore.setState({ currentSession: testSession })
    })

    it('should set new anchor story', () => {
      const store = usePlanningStore.getState()

      store.setAnchorStory('story-2')

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.anchorStoryId).toBe('story-2')
      expect(
        currentSession?.stories.find(s => s.id === 'story-1')?.isAnchor
      ).toBe(false)
      expect(
        currentSession?.stories.find(s => s.id === 'story-2')?.isAnchor
      ).toBe(true)
    })

    it('should throw error for non-existent story', () => {
      const store = usePlanningStore.getState()

      expect(() => store.setAnchorStory('non-existent')).toThrow(
        'Story not found'
      )
    })
  })

  describe('togglePointAssignmentMode', () => {
    beforeEach(() => {
      const testSession = createTestSession({ isPointAssignmentMode: false })
      usePlanningStore.setState({ currentSession: testSession })
    })

    it('should toggle point assignment mode', () => {
      const store = usePlanningStore.getState()

      store.togglePointAssignmentMode()

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.isPointAssignmentMode).toBe(true)

      store.togglePointAssignmentMode()

      const updatedSession = usePlanningStore.getState().currentSession
      expect(updatedSession?.isPointAssignmentMode).toBe(false)
    })
  })

  describe('updatePointCutoffs', () => {
    beforeEach(() => {
      const testSession = createTestSession()
      usePlanningStore.setState({ currentSession: testSession })
    })

    it('should update point cutoffs', () => {
      const cutoffs: PointCutoff[] = [
        createTestPointCutoff({ id: 'cutoff-1', position: -50, pointValue: 1 }),
        createTestPointCutoff({ id: 'cutoff-2', position: 0, pointValue: 3 }),
        createTestPointCutoff({ id: 'cutoff-3', position: 50, pointValue: 8 }),
      ]

      const store = usePlanningStore.getState()
      store.updatePointCutoffs(cutoffs)

      const { currentSession } = usePlanningStore.getState()
      expect(currentSession?.pointCutoffs).toHaveLength(3)
      expect(currentSession?.pointCutoffs[0].pointValue).toBe(1)
      expect(currentSession?.pointCutoffs[1].pointValue).toBe(3)
      expect(currentSession?.pointCutoffs[2].pointValue).toBe(8)
    })
  })

  describe('exportResults', () => {
    it('should export session results with story points', () => {
      const stories = [
        createTestStory({ id: 'story-1', title: 'Story 1', position: { x: -60, y: 0 } }),
        createTestStory({ id: 'story-2', title: 'Story 2', position: { x: -10, y: 0 } }),
        createTestStory({ id: 'story-3', title: 'Story 3', position: { x: 30, y: 0 } }),
        createTestStory({ id: 'story-4', title: 'Story 4', position: { x: 70, y: 0 } }),
      ]

      const cutoffs: PointCutoff[] = [
        createTestPointCutoff({ position: { x: -50, y: 0 }, pointValue: 1 }),
        createTestPointCutoff({ position: { x: 0, y: 0 }, pointValue: 3 }),
        createTestPointCutoff({ position: { x: 50, y: 0 }, pointValue: 8 }),
      ]

      const testSession = createTestSession({
        name: 'Export Test Session',
        stories,
        pointCutoffs: cutoffs,
      })
      usePlanningStore.setState({ currentSession: testSession })

      const store = usePlanningStore.getState()
      const exportData = store.exportResults()

      expect(exportData.sessionName).toBe('Export Test Session')
      expect(exportData.totalStories).toBe(4)
      expect(exportData.stories).toHaveLength(4)

      // Check story point assignments based on cutoffs
      expect(exportData.stories[0].storyPoints).toBeNull() // position -60, before first cutoff
      expect(exportData.stories[1].storyPoints).toBe(1) // position -10, between -50 and 0
      expect(exportData.stories[2].storyPoints).toBe(3) // position 30, between 0 and 50
      expect(exportData.stories[3].storyPoints).toBe(8) // position 70, after 50
    })

    it('should throw error when no active session', () => {
      usePlanningStore.setState({ currentSession: null })

      const store = usePlanningStore.getState()

      expect(() => store.exportResults()).toThrow('No active session to export')
    })
  })
})
