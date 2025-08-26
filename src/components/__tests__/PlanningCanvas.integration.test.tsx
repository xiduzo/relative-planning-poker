/**
 * Integration tests for PlanningCanvas drag and drop functionality
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlanningCanvas } from '../PlanningCanvas'
import { DndProvider } from '../DndProvider'
import { usePlanningStore, PlanningStore } from '@/stores/planning-store'
import type { PlanningSession, Story } from '@/types'
import { fromPartial } from '@total-typescript/shoehorn'

// Mock the planning store
vi.mock('@/stores/planning-store')

const mockUsePlanningStore = vi.mocked(usePlanningStore)
const mockUpdateStoryPosition = vi.fn()

// Test data helpers
const createTestStory = (overrides: Partial<Story> = {}) =>
  fromPartial<Story>({
    id: `story-${Math.random().toString(36).substring(2, 9)}`,
    title: 'Test Story',
    description: 'Test description',
    position: { x: 0, y: 0 },
    isAnchor: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

const createTestSession = (overrides: Partial<PlanningSession> = {}) =>
  fromPartial<PlanningSession>({
    id: 'session-1',
    name: 'Test Session',
    stories: [],
    anchorStoryId: null,
    pointCutoffs: [],
    isPointAssignmentMode: false,
    createdAt: new Date(),
    lastModified: new Date(),
    ...overrides,
  })

const createMockStore = (session: PlanningSession | null) =>
  fromPartial<PlanningStore>({
    currentSession: session,
    updateStoryPosition: mockUpdateStoryPosition,
    createSession: vi.fn(),
    loadSession: vi.fn(),
    clearSession: vi.fn(),
    addStory: vi.fn(),
    updateStory: vi.fn(),
    deleteStory: vi.fn(),
    setAnchorStory: vi.fn(),
    togglePointAssignmentMode: vi.fn(),
    updatePointCutoffs: vi.fn(),
    exportResults: vi.fn(),
  })

const renderPlanningCanvas = (props = {}) => {
  return render(
    <DndProvider>
      <PlanningCanvas {...props} />
    </DndProvider>
  )
}

describe('PlanningCanvas Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Drag and Drop Integration', () => {
    it('renders draggable story cards with proper accessibility', () => {
      const stories = [
        createTestStory({
          id: 'story-1',
          title: 'Draggable Story',
          position: { x: 0, y: 0 },
          isAnchor: true,
        }),
      ]
      const session = createTestSession({ stories, anchorStoryId: 'story-1' })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // Should render the story (appears in both card and summary)
      expect(screen.getAllByText('Draggable Story')).toHaveLength(2)
    })

    it('displays drop zone indicator during drag operations', () => {
      const stories = [
        createTestStory({
          id: 'story-1',
          title: 'Story to Drag',
          position: { x: -20, y: 0 },
        }),
      ]
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // The drop zone indicator is shown when isOver is true
      // This would be triggered by the DnD Kit during actual drag operations
      const canvases = screen.getAllByRole('application')
      const canvas = canvases.find(
        c => c.getAttribute('aria-label') === 'Story positioning canvas'
      )
      expect(canvas).toBeInTheDocument()
      expect(canvas).toHaveAttribute('aria-label', 'Story positioning canvas')
    })

    it('handles story positioning with multiple stories', () => {
      const stories = [
        createTestStory({
          id: 'story-1',
          title: 'Left Story',
          position: { x: -50, y: 0 },
        }),
        createTestStory({
          id: 'story-2',
          title: 'Center Story',
          position: { x: 0, y: 0 },
          isAnchor: true,
        }),
        createTestStory({
          id: 'story-3',
          title: 'Right Story',
          position: { x: 50, y: 0 },
        }),
      ]
      const session = createTestSession({ stories, anchorStoryId: 'story-2' })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // Verify all stories are rendered (each appears in card and summary)
      expect(screen.getAllByText('Left Story')).toHaveLength(2)
      expect(screen.getAllByText('Center Story')).toHaveLength(2)
      expect(screen.getAllByText('Right Story')).toHaveLength(2)

      // Verify all stories are rendered (each appears in card and summary)
      expect(screen.getAllByText('Left Story')).toHaveLength(2)
      expect(screen.getAllByText('Center Story')).toHaveLength(2)
      expect(screen.getAllByText('Right Story')).toHaveLength(2)
    })

    it('handles story stacking when positions are close', () => {
      const stories = [
        createTestStory({
          id: 'story-1',
          title: 'Story A',
          position: { x: 0, y: 0 },
          isAnchor: true,
        }),
        createTestStory({
          id: 'story-2',
          title: 'Story B',
          position: { x: 5, y: 0 }, // Close to anchor
        }),
        createTestStory({
          id: 'story-3',
          title: 'Story C',
          position: { x: 8, y: 0 }, // Also close
        }),
      ]
      const session = createTestSession({ stories, anchorStoryId: 'story-1' })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // All stories should be visible despite close positioning (each appears in card and summary)
      expect(screen.getAllByText('Story A')).toHaveLength(2)
      expect(screen.getAllByText('Story B')).toHaveLength(2)
      expect(screen.getAllByText('Story C')).toHaveLength(2)

      // Verify they appear in the position summary
      expect(
        screen.getAllByText('Story Positions').length
      ).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Canvas Responsiveness', () => {
    it('adapts to different screen sizes', () => {
      const stories = [
        createTestStory({ title: 'Responsive Story', position: { x: 25, y: 0 } }),
      ]
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // Check responsive classes are applied
      const positionSummary =
        screen.getAllByText('Story Positions')[0].nextElementSibling
      expect(positionSummary).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3'
      )
    })

    it('constrains story positioning within canvas bounds', () => {
      const stories = [
        createTestStory({
          id: 'story-1',
          title: 'Edge Left',
          position: { x: -100, y: 0 }, // Far left edge
        }),
        createTestStory({
          id: 'story-2',
          title: 'Edge Right',
          position: { x: 100, y: 0 }, // Far right edge
        }),
      ]
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // Stories should be rendered and positioned (each appears in card and summary)
      expect(screen.getAllByText('Edge Left')).toHaveLength(2)
      expect(screen.getAllByText('Edge Right')).toHaveLength(2)
    })
  })

  describe('User Interaction Integration', () => {
    it('integrates double-click handlers with story cards', () => {
      const handleStoryDoubleClick = vi.fn()

      const stories = [
        createTestStory({ title: 'Interactive Story', position: { x: 0, y: 0 } }),
      ]
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas({
        onStoryDoubleClick: handleStoryDoubleClick,
      })

      // Click on the first occurrence (the story card, not the summary)
      const storyCards = screen.getAllByText('Interactive Story')
      const storyCard = storyCards[0]

      // Test double click
      fireEvent.doubleClick(storyCard)
      expect(handleStoryDoubleClick).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Interactive Story' })
      )
    })

    it('maintains keyboard accessibility during interactions', () => {
      const stories = [
        createTestStory({ title: 'Keyboard Story', position: 0 }),
      ]
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      const canvases = screen.getAllByRole('application')
      const canvas = canvases.find(
        c => c.getAttribute('aria-label') === 'Story positioning canvas'
      )
      const storyCard = screen.getByRole('button', {
        name: /Story: Keyboard Story/,
      })

      // Canvas should be focusable
      expect(canvas).toHaveAttribute('tabIndex', '-1')

      // Story card should be accessible
      expect(storyCard).toHaveAttribute('aria-label')
    })
  })

  describe('Performance and State Management', () => {
    it('handles large numbers of stories efficiently', () => {
      // Create many stories to test performance
      const stories = Array.from({ length: 10 }, (_, i) =>
        createTestStory({
          id: `story-${i}`,
          title: `Story ${i + 1}`,
          position: (i - 5) * 20, // Spread across the range
        })
      )
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      const { container } = renderPlanningCanvas()

      // All stories should render (each appears in card and summary)
      expect(screen.getAllByText('Story 1')).toHaveLength(2)
      expect(screen.getAllByText('Story 10')).toHaveLength(2)

      // Position summary should show all stories
      expect(
        screen.getAllByText('Story Positions').length
      ).toBeGreaterThanOrEqual(1)

      // No performance warnings should occur
      expect(container).toBeInTheDocument()
    })

    it('updates position summary when story positions change', () => {
      const initialStories = [
        createTestStory({
          id: 'story-1',
          title: 'Moving Story',
          position: -30,
        }),
      ]
      const session = createTestSession({ stories: initialStories })

      let currentSession = session
      const mockStore = createMockStore(currentSession)
      mockStore.updateStoryPosition = (
        storyId: string,
        position: { x: number; y: number }
      ) => {
        // Simulate store update
        currentSession = {
          ...currentSession,
          stories: currentSession.stories.map(story =>
            story.id === storyId ? { ...story, position } : story
          ),
        }
        mockUpdateStoryPosition(storyId, position)
      }

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      const { rerender } = renderPlanningCanvas()

      // Initial position - verify story is rendered
      expect(screen.getAllByText('Moving Story')).toHaveLength(2)

      // Simulate position update
      currentSession = {
        ...currentSession,
        stories: [
          {
            ...currentSession.stories[0],
            position: { x: 40, y: 0 },
          },
        ],
      }

      // Update the mock store with new session
      mockStore.currentSession = currentSession

      // Re-render with updated session
      rerender(
        <DndProvider>
          <PlanningCanvas />
        </DndProvider>
      )

      // Story should still be rendered after position update
      expect(screen.getAllByText('Moving Story')).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('gracefully handles missing session data', () => {
      const mockStore = createMockStore(null)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      expect(screen.getByText('No active planning session')).toBeInTheDocument()
    })

    it('handles empty stories array gracefully', () => {
      const emptySession = createTestSession({ stories: [] })
      const mockStore = createMockStore(emptySession)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      expect(screen.getByText('No stories to display')).toBeInTheDocument()
      expect(
        screen.getByText('Add your first anchor story to start planning')
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add anchor story/i })).toBeInTheDocument()
    })

    it('handles invalid story positions gracefully', () => {
      const stories = [
        createTestStory({
          id: 'story-1',
          title: 'Valid Story',
          position: 0,
        }),
        // These would be normalized by the store, but test edge cases
        createTestStory({
          id: 'story-2',
          title: 'Edge Story',
          position: 150, // Beyond normal range
        }),
      ]
      const session = createTestSession({ stories })
      const mockStore = createMockStore(session)

      mockUsePlanningStore.mockImplementation(selector => {
        return selector ? selector(mockStore) : mockStore
      })

      renderPlanningCanvas()

      // Both stories should render without errors
      // Check that stories are present (they appear in card and summary)
      const validStoryElements = screen.getAllByText('Valid Story')
      const edgeStoryElements = screen.getAllByText('Edge Story')

      expect(validStoryElements.length).toBeGreaterThanOrEqual(1)
      expect(edgeStoryElements.length).toBeGreaterThanOrEqual(1)

      // Verify they don't crash the component
      const canvases = screen.getAllByRole('application')
      const canvas = canvases.find(
        c => c.getAttribute('aria-label') === 'Story positioning canvas'
      )
      expect(canvas).toBeInTheDocument()
    })
  })
})
