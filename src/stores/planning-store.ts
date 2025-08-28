/**
 * Zustand store for managing planning session state
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  PlanningSession,
  Story,
  PointCutoff,
  CreateStoryInput,
  ExportData,
  StorySchema,
  CreateStoryInputSchema,
  PlanningSessionSchema,
} from '@/types'
import { generateId } from '@/utils'
import {
  normalizePosition2D,
  ANCHOR_POSITION,
  adjustStoriesRelativeToNewAnchor,
} from '@/utils/position'

export interface PlanningStore {
  // State
  currentSession: PlanningSession | null
  sessions: Record<string, PlanningSession>

  // Session actions
  createSession: (name: string, code: string) => void
  loadSessionByCode: (code: string) => boolean
  clearSession: () => void

  // Story management actions
  addStory: (input: CreateStoryInput) => void
  updateStory: (
    storyId: string,
    updates: Partial<Pick<Story, 'title' | 'description'>>
  ) => void
  updateStoryPosition: (
    storyId: string,
    position: { x: number; y: number }
  ) => void
  deleteStory: (storyId: string) => void

  // Anchor story management
  setAnchorStory: (storyId: string) => void

  // Point assignment mode
  togglePointAssignmentMode: () => void
  updatePointCutoffs: (cutoffs: PointCutoff[]) => void

  // Export functionality
  exportResults: () => ExportData
}

const STORAGE_KEY = 'relative-planning-poker-sessions'

// Helper function to get all sessions from localStorage
const getAllSessions = (): Record<string, PlanningSession> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to load sessions from localStorage:', error)
    return {}
  }
}

export const usePlanningStore = create<PlanningStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: {},

      createSession: (name: string, code: string) => {
        const now = new Date()
        const session: PlanningSession = {
          id: generateId(),
          name: name,
          code: code,
          stories: [],
          anchorStoryId: null,
          pointCutoffs: [],
          isPointAssignmentMode: false,
          createdAt: now,
          lastModified: now,
        }

        // Validate the session
        const validationResult = PlanningSessionSchema.safeParse(session)
        if (!validationResult.success) {
          console.error('Invalid session data:', validationResult.error)
          throw new Error('Failed to create session: Invalid data')
        }

        set({
          currentSession: session,
          sessions: { ...get().sessions, [session.id]: session },
        })
      },

      loadSessionByCode: (code: string) => {
        try {
          const sessions = getAllSessions()
          const session = Object.values(sessions).find(
            session => session.code === code
          )

          if (!session) {
            return false
          }

          // Parse dates from stored JSON
          const parsedSession: PlanningSession = {
            ...session,
            createdAt: new Date(session.createdAt),
            lastModified: new Date(session.lastModified),
            stories: session.stories.map(story => ({
              ...story,
              createdAt: new Date(story.createdAt),
              updatedAt: new Date(story.updatedAt),
            })),
          }

          // Validate the loaded session
          const validationResult =
            PlanningSessionSchema.safeParse(parsedSession)
          if (!validationResult.success) {
            console.error(
              'Invalid session data loaded:',
              validationResult.error
            )
            return false
          }

          set({ currentSession: parsedSession })
          return true
        } catch (error) {
          console.error('Failed to load session by code:', error)
          return false
        }
      },

      clearSession: () => {
        set({ currentSession: null })
      },

      addStory: (input: CreateStoryInput) => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        // Validate input
        const validationResult = CreateStoryInputSchema.safeParse(input)
        if (!validationResult.success) {
          throw new Error(
            `Invalid story data: ${validationResult.error.message}`
          )
        }

        const now = new Date()
        const isFirstStory = currentSession.stories.length === 0

        const newStory: Story = {
          id: generateId(),
          title: input.title.trim(),
          description: input.description.trim(),
          position: ANCHOR_POSITION, // Start at center (anchor position)
          isAnchor: isFirstStory,
          createdAt: now,
          updatedAt: now,
        }

        // Validate the new story
        const storyValidation = StorySchema.safeParse(newStory)
        if (!storyValidation.success) {
          throw new Error(`Invalid story: ${storyValidation.error.message}`)
        }

        const updatedSession: PlanningSession = {
          ...currentSession,
          stories: [...currentSession.stories, newStory],
          anchorStoryId: isFirstStory
            ? newStory.id
            : currentSession.anchorStoryId,
          lastModified: now,
        }

        set({
          currentSession: updatedSession,
          sessions: { ...get().sessions, [updatedSession.id]: updatedSession },
        })
      },

      updateStory: (
        storyId: string,
        updates: Partial<Pick<Story, 'title' | 'description'>>
      ) => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        const storyIndex = currentSession.stories.findIndex(
          s => s.id === storyId
        )
        if (storyIndex === -1) {
          throw new Error('Story not found')
        }

        const now = new Date()
        const updatedStories = [...currentSession.stories]
        updatedStories[storyIndex] = {
          ...updatedStories[storyIndex],
          ...updates,
          title: updates.title?.trim() || updatedStories[storyIndex].title,
          description:
            updates.description?.trim() ||
            updatedStories[storyIndex].description,
          updatedAt: now,
        }

        // Validate the updated story
        const storyValidation = StorySchema.safeParse(
          updatedStories[storyIndex]
        )
        if (!storyValidation.success) {
          throw new Error(
            `Invalid story update: ${storyValidation.error.message}`
          )
        }

        const updatedSession: PlanningSession = {
          ...currentSession,
          stories: updatedStories,
          lastModified: now,
        }

        set({
          currentSession: updatedSession,
          sessions: { ...get().sessions, [updatedSession.id]: updatedSession },
        })
      },

      updateStoryPosition: (
        storyId: string,
        position: { x: number; y: number }
      ) => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        const storyIndex = currentSession.stories.findIndex(
          s => s.id === storyId
        )
        if (storyIndex === -1) {
          throw new Error('Story not found')
        }

        // Check if this is the anchor story - anchor stories cannot be moved
        const story = currentSession.stories[storyIndex]
        if (story.isAnchor) {
          throw new Error('Anchor story cannot be moved')
        }

        // Normalize position to valid range
        const normalizedPosition = normalizePosition2D(position)
        const now = new Date()

        const updatedStories = [...currentSession.stories]
        updatedStories[storyIndex] = {
          ...updatedStories[storyIndex],
          position: normalizedPosition,
          updatedAt: now,
        }

        const updatedSession: PlanningSession = {
          ...currentSession,
          stories: updatedStories,
          lastModified: now,
        }

        set({
          currentSession: updatedSession,
          sessions: { [updatedSession.id]: updatedSession },
        })
      },

      deleteStory: (storyId: string) => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        const storyToDelete = currentSession.stories.find(s => s.id === storyId)
        if (!storyToDelete) {
          throw new Error('Story not found')
        }

        // Prevent anchor story deletion when other stories exist
        if (storyToDelete.isAnchor && currentSession.stories.length > 1) {
          throw new Error('Cannot delete anchor story when other stories exist')
        }

        const remainingStories = currentSession.stories.filter(
          s => s.id !== storyId
        )
        const now = new Date()

        let newAnchorStoryId = currentSession.anchorStoryId

        // If we're deleting the anchor story, promote another story to anchor
        if (storyToDelete.isAnchor && remainingStories.length > 0) {
          // Find the story closest to center (0,0) to be the new anchor
          const newAnchor = remainingStories.reduce((closest, story) => {
            const closestDistance = Math.sqrt(
              closest.position.x ** 2 + closest.position.y ** 2
            )
            const currentDistance = Math.sqrt(
              story.position.x ** 2 + story.position.y ** 2
            )
            return currentDistance < closestDistance ? story : closest
          })

          newAnchor.isAnchor = true
          newAnchorStoryId = newAnchor.id
        } else if (remainingStories.length === 0) {
          newAnchorStoryId = null
        }

        const updatedSession: PlanningSession = {
          ...currentSession,
          stories: remainingStories,
          anchorStoryId: newAnchorStoryId,
          lastModified: now,
        }

        set({
          currentSession: updatedSession,
          sessions: { ...get().sessions, [updatedSession.id]: updatedSession },
        })
      },

      setAnchorStory: (storyId: string) => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        const targetStory = currentSession.stories.find(s => s.id === storyId)
        if (!targetStory) {
          throw new Error('Story not found')
        }

        const now = new Date()
        const updatedStories = currentSession.stories.map(story => ({
          ...story,
          isAnchor: story.id === storyId,
          updatedAt:
            story.id === storyId || story.isAnchor ? now : story.updatedAt,
        }))

        // Adjust all story positions relative to the new anchor
        const adjustedStories = adjustStoriesRelativeToNewAnchor(
          updatedStories,
          storyId,
          ANCHOR_POSITION
        )

        const updatedSession: PlanningSession = {
          ...currentSession,
          stories: adjustedStories,
          anchorStoryId: storyId,
          lastModified: now,
        }

        set({
          currentSession: updatedSession,
          sessions: { [updatedSession.id]: updatedSession },
        })
      },

      togglePointAssignmentMode: () => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        const updatedSession: PlanningSession = {
          ...currentSession,
          isPointAssignmentMode: !currentSession.isPointAssignmentMode,
          lastModified: new Date(),
        }

        set({
          currentSession: updatedSession,
          sessions: { ...get().sessions, [updatedSession.id]: updatedSession },
        })
      },

      updatePointCutoffs: (cutoffs: PointCutoff[]) => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session')
        }

        const updatedSession: PlanningSession = {
          ...currentSession,
          pointCutoffs: [...cutoffs],
          lastModified: new Date(),
        }

        set({
          currentSession: updatedSession,
          sessions: { ...get().sessions, [updatedSession.id]: updatedSession },
        })
      },

      exportResults: (): ExportData => {
        const { currentSession } = get()
        if (!currentSession) {
          throw new Error('No active session to export')
        }

        // Calculate story points based on cutoffs
        const storiesWithPoints = currentSession.stories.map(story => {
          let storyPoints: number | null = null

          // Find the appropriate point value based on cutoffs (using x-coordinate for complexity)
          const sortedCutoffs = [...currentSession.pointCutoffs].sort(
            (a, b) => a.position.x - b.position.x
          )

          for (let i = 0; i < sortedCutoffs.length; i++) {
            const cutoff = sortedCutoffs[i]
            const nextCutoff = sortedCutoffs[i + 1]

            if (nextCutoff) {
              // Story is between this cutoff and the next
              if (
                story.position.x >= cutoff.position.x &&
                story.position.x < nextCutoff.position.x
              ) {
                storyPoints = cutoff.pointValue
                break
              }
            } else {
              // This is the last cutoff, story is beyond it
              if (story.position.x >= cutoff.position.x) {
                storyPoints = cutoff.pointValue
                break
              }
            }
          }

          return {
            title: story.title,
            description: story.description,
            storyPoints,
            relativePosition: story.position.x, // Use x-coordinate for complexity
          }
        })

        return {
          sessionName: currentSession.name,
          exportedAt: new Date(),
          stories: storiesWithPoints,
          totalStories: currentSession.stories.length,
        }
      },
    }),
    {
      name: 'planning-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        currentSession: state.currentSession,
        sessions: state.sessions,
      }),
    }
  )
)
