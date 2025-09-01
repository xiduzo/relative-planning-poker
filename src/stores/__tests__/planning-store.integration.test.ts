/**
 * Integration tests for PlanningStore with utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlanningStore } from '../planning-store'

import { validateStory } from '@/utils/validation'
import { generateId } from '@/utils/id'

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

describe('PlanningStore Integration', () => {
  beforeEach(() => {
    usePlanningStore.setState({ currentSession: null })
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should integrate with position utilities', () => {
    const store = usePlanningStore.getState()

    // Create session and add story
    store.createSession('Integration Test', 'INT001')
    store.addStory({ title: 'Test Story', description: 'Test description' })

    // Test position normalization integration
    const extremePosition = { x: 150, y: 0 } // Above max
    const normalizedPosition = { x: 100, y: 0 } // Max value

    // Get the non-anchor story (first story is anchor by default)
    const { currentSession } = usePlanningStore.getState()
    const nonAnchorStory = currentSession!.stories.find(s => !s.isAnchor)

    if (nonAnchorStory) {
      store.updateStoryPosition(nonAnchorStory.id, extremePosition)

      const updatedSession = usePlanningStore.getState().currentSession
      const updatedStory = updatedSession!.stories.find(
        s => s.id === nonAnchorStory.id
      )
      expect(updatedStory?.position.x).toBe(normalizedPosition.x)
      expect(updatedStory?.position.x).toBe(100) // Max value
    } else {
      // If no non-anchor story, add another story to test with
      store.addStory({
        title: 'Non-Anchor Story',
        description: 'Test description',
      })
      const newStory = usePlanningStore
        .getState()
        .currentSession!.stories.find(s => !s.isAnchor)

      store.updateStoryPosition(newStory!.id, extremePosition)

      const updatedSession = usePlanningStore.getState().currentSession
      const updatedStory = updatedSession!.stories.find(
        s => s.id === newStory!.id
      )
      expect(updatedStory?.position.x).toBe(normalizedPosition.x)
      expect(updatedStory?.position.x).toBe(100) // Max value
    }
  })

  it('should integrate with validation utilities', () => {
    const store = usePlanningStore.getState()

    // Create session and add story
    store.createSession('Integration Test', 'INT002')
    store.addStory({ title: 'Test Story', description: 'Test description' })

    const { currentSession } = usePlanningStore.getState()
    const story = currentSession!.stories[0]

    // Test validation integration
    const validationResult = validateStory(story)
    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toHaveLength(0)
  })

  it('should integrate with ID generation utilities', () => {
    // Test that generated IDs are unique
    const id1 = generateId()
    const id2 = generateId()

    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(typeof id2).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
    expect(id2.length).toBeGreaterThan(0)
  })

  it('should persist and restore session data correctly', () => {
    const store = usePlanningStore.getState()

    // Create session with stories
    store.createSession('Persistence Test', 'PERS01')
    store.addStory({ title: 'Story 1', description: 'Description 1' })
    store.addStory({ title: 'Story 2', description: 'Description 2' })
    store.updateStoryPosition(
      usePlanningStore.getState().currentSession!.stories[1].id,
      { x: 50, y: 0 }
    )

    const originalSession = usePlanningStore.getState().currentSession!

    // Verify session was created successfully
    expect(originalSession).toBeDefined()

    // Simulate loading from localStorage
    const sessionData = {
      [originalSession.code]: {
        ...originalSession,
        createdAt: originalSession.createdAt.toISOString(),
        lastModified: originalSession.lastModified.toISOString(),
        stories: originalSession.stories.map(story => ({
          ...story,
          createdAt: story.createdAt.toISOString(),
          updatedAt: story.updatedAt.toISOString(),
        })),
      },
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData))

    // Clear current session and load from storage
    usePlanningStore.setState({ currentSession: null })
    const loadResult = store.loadSession(originalSession.code)

    expect(loadResult).toBe(true)

    const { currentSession } = usePlanningStore.getState()
    expect(currentSession).toBeDefined()
    expect(currentSession?.code).toBe(originalSession.code)
    expect(currentSession?.name).toBe('Persistence Test')
    expect(currentSession?.stories).toHaveLength(2)
    expect(currentSession?.stories[0].title).toBe('Story 1')
    expect(currentSession?.stories[1].title).toBe('Story 2')
    expect(currentSession?.stories[1].position.x).toBe(50)
  })

  it('should handle complex story management workflows', () => {
    const store = usePlanningStore.getState()

    // Create session
    store.createSession('Complex Workflow Test', 'COMP01')

    // Add multiple stories
    store.addStory({ title: 'Story A', description: 'First story' })
    store.addStory({ title: 'Story B', description: 'Second story' })
    store.addStory({ title: 'Story C', description: 'Third story' })

    let { currentSession } = usePlanningStore.getState()
    expect(currentSession?.stories).toHaveLength(3)

    // Position stories
    const storyIds = currentSession!.stories.map(s => s.id)
    store.updateStoryPosition(storyIds[1], { x: -30, y: 0 }) // Story B to left
    store.updateStoryPosition(storyIds[2], { x: 40, y: 0 }) // Story C to right

    // Update story content
    store.updateStory(storyIds[0], { title: 'Updated Story A' })

    // Change anchor
    store.setAnchorStory(storyIds[1])

    currentSession = usePlanningStore.getState().currentSession!
    expect(currentSession.stories.find(s => s.id === storyIds[0])?.title).toBe(
      'Updated Story A'
    )
    expect(
      currentSession.stories.find(s => s.id === storyIds[1])?.isAnchor
    ).toBe(true)
    expect(
      currentSession.stories.find(s => s.id === storyIds[0])?.isAnchor
    ).toBe(false)
    expect(currentSession.anchorStoryId).toBe(storyIds[1])

    // Verify relative positioning: new anchor should be at (0,0) and other stories
    // should maintain their relative positions to the new anchor
    const newAnchor = currentSession.stories.find(s => s.id === storyIds[1])
    const oldAnchor = currentSession.stories.find(s => s.id === storyIds[0])
    const storyC = currentSession.stories.find(s => s.id === storyIds[2])

    expect(newAnchor?.position).toEqual({ x: 0, y: 0 })
    // Old anchor should maintain relative position from new anchor
    expect(oldAnchor?.position.x).toBe(30)
    expect(storyC?.position.x).toBe(70)

    // Delete a story
    store.deleteStory(storyIds[2])

    currentSession = usePlanningStore.getState().currentSession!
    expect(currentSession.stories).toHaveLength(2)
    expect(
      currentSession.stories.find(s => s.id === storyIds[2])
    ).toBeUndefined()
  })
})
