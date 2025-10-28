import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils/validation'
import {
  createSession,
  getSessionByCode,
  addStory,
  updateStory,
  updateStoryPosition,
  deleteStory,
  setAnchorStory,
  setAnchorStoryPoints,
} from '@/actions/session'
import { CreateStoryInput, PlanningSession, Story } from '@/types'

function isPlanningSession(value: unknown): value is PlanningSession {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<PlanningSession>
  return (
    typeof s.id === 'string' &&
    typeof s.code === 'string' &&
    Array.isArray(s.stories)
  )
}

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  byCode: (code: string) => [...sessionKeys.all, 'byCode', code] as const,
}

// Hooks for queries
export function useSession(code: string) {
  return useQuery({
    queryKey: sessionKeys.byCode(code),
    queryFn: async () => {
      const result = await getSessionByCode(code)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!code,
    refetchInterval: 1 * 1000, // 10 seconds
  })
}

// Hooks for mutations
export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createSession(name)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: data => {
      // Invalidate and refetch session queries
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      // Set the new session in cache
      if (data) {
        queryClient.setQueryData(sessionKeys.byCode(data.code), data)
      }
      toast.success('Session created')
    },
    onError: error => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useAddStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      input,
    }: {
      sessionId: string
      input: CreateStoryInput
    }) => {
      const result = await addStory(sessionId, input)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async ({ sessionId, input }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })

      // Find the session code for this sessionId
      const sessionQueries = queryClient.getQueriesData({
        queryKey: sessionKeys.all,
      })
      let sessionCode: string | undefined

      for (const [, sessionData] of sessionQueries) {
        if (isPlanningSession(sessionData) && sessionData.id === sessionId) {
          sessionCode = sessionData.code
          break
        }
      }

      if (!sessionCode) return

      // Snapshot the previous value
      const previousSession = queryClient.getQueryData(
        sessionKeys.byCode(sessionCode)
      )

      // Optimistically update the session
      if (previousSession && typeof previousSession === 'object') {
        const existingStories =
          (previousSession as PlanningSession).stories ?? []
        const isFirstStory =
          !Array.isArray(existingStories) || existingStories.length === 0
        const optimisticStory = {
          id: `temp-${Date.now()}`, // Temporary ID
          title: input.title,
          description: input.description || '',
          position: { x: 0, y: 0 }, // Will be set by server
          isAnchor: isFirstStory, // True if no existing stories
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedSession = {
          ...(previousSession as PlanningSession),
          stories: [
            ...((previousSession as PlanningSession).stories ?? []),
            optimisticStory,
          ],
        }

        queryClient.setQueryData(
          sessionKeys.byCode(sessionCode),
          updatedSession
        )
      }

      // Return a context object with the snapshotted value
      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSession && context?.sessionCode) {
        queryClient.setQueryData(
          sessionKeys.byCode(context.sessionCode),
          context.previousSession
        )
      }
      toast.error(getErrorMessage(err))
    },
    onSuccess: (response, _variables, context) => {
      if ('data' in response) {
        queryClient.setQueryData(
          sessionKeys.byCode(context?.sessionCode ?? ''),
          response.data
        )
      }
      toast.success('Story added')
    },
  })
}

export function useUpdateStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      storyId,
      updates,
    }: {
      storyId: string
      updates: { title?: string; description?: string }
    }) => {
      const result = await updateStory(storyId, updates)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async ({ storyId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })

      // Find which session contains this story
      const sessionQueries = queryClient.getQueriesData({
        queryKey: sessionKeys.all,
      })
      let sessionCode: string | undefined
      let previousSession: PlanningSession | undefined

      for (const [, sessionData] of sessionQueries) {
        if (isPlanningSession(sessionData)) {
          const stories = sessionData.stories
          if (
            Array.isArray(stories) &&
            stories.some((story: Story) => story.id === storyId)
          ) {
            sessionCode = sessionData.code
            previousSession = sessionData
            break
          }
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically update the story
      const updatedSession = {
        ...(previousSession as PlanningSession),
        stories: (previousSession as PlanningSession).stories.map(
          (story: Story) =>
            story.id === storyId
              ? { ...story, ...updates, updatedAt: new Date() }
              : story
        ),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousSession && context?.sessionCode) {
        queryClient.setQueryData(
          sessionKeys.byCode(context.sessionCode),
          context.previousSession
        )
      }
      toast.error(getErrorMessage(err))
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('Story updated')
    },
  })
}

export function useUpdateStoryPosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      storyId,
      position,
    }: {
      storyId: string
      position: { x: number; y: number }
    }) => {
      const result = await updateStoryPosition(storyId, position)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async ({ storyId, position }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })

      // Find which session contains this story
      const sessionQueries = queryClient.getQueriesData({
        queryKey: sessionKeys.all,
      })
      let sessionCode: string | undefined
      let previousSession: PlanningSession | undefined

      for (const [, sessionData] of sessionQueries) {
        if (isPlanningSession(sessionData)) {
          const stories = sessionData.stories
          if (
            Array.isArray(stories) &&
            stories.some((story: Story) => story.id === storyId)
          ) {
            sessionCode = sessionData.code
            previousSession = sessionData
            break
          }
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically update the story position
      const updatedSession = {
        ...(previousSession as PlanningSession),
        stories: (previousSession as PlanningSession).stories.map(
          (story: Story) =>
            story.id === storyId
              ? { ...story, position, updatedAt: new Date() }
              : story
        ),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousSession && context?.sessionCode) {
        queryClient.setQueryData(
          sessionKeys.byCode(context.sessionCode),
          context.previousSession
        )
      }
      toast.error(getErrorMessage(err))
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    },
  })
}

export function useDeleteStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (storyId: string) => {
      const result = await deleteStory(storyId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async storyId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })

      // Find which session contains this story
      const sessionQueries = queryClient.getQueriesData({
        queryKey: sessionKeys.all,
      })
      let sessionCode: string | undefined
      let previousSession: PlanningSession | undefined

      for (const [, sessionData] of sessionQueries) {
        if (isPlanningSession(sessionData)) {
          const stories = sessionData.stories
          if (
            Array.isArray(stories) &&
            stories.some((story: Story) => story.id === storyId)
          ) {
            sessionCode = sessionData.code
            previousSession = sessionData
            break
          }
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically remove the story
      const updatedSession = {
        ...(previousSession as PlanningSession),
        stories: (previousSession as PlanningSession).stories.filter(
          (story: Story) => story.id !== storyId
        ),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousSession && context?.sessionCode) {
        queryClient.setQueryData(
          sessionKeys.byCode(context.sessionCode),
          context.previousSession
        )
      }
      toast.error(getErrorMessage(err))
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('Story deleted')
    },
  })
}

export function useSetAnchorStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      storyId,
    }: {
      sessionId: string
      storyId: string
    }) => {
      const result = await setAnchorStory(sessionId, storyId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async ({ sessionId, storyId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })

      // Find the session code for this sessionId
      const sessionQueries = queryClient.getQueriesData({
        queryKey: sessionKeys.all,
      })
      let sessionCode: string | undefined
      let previousSession: PlanningSession | undefined

      for (const [, sessionData] of sessionQueries) {
        if (isPlanningSession(sessionData) && sessionData.id === sessionId) {
          sessionCode = sessionData.code
          previousSession = sessionData
          break
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically update anchor story
      const updatedSession = {
        ...(previousSession as PlanningSession),
        anchorStoryId: storyId,
        stories: (previousSession as PlanningSession).stories.map(
          (story: Story) => ({
            ...story,
            isAnchor: story.id === storyId,
            // Position will be updated by server
          })
        ),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousSession && context?.sessionCode) {
        queryClient.setQueryData(
          sessionKeys.byCode(context.sessionCode),
          context.previousSession
        )
      }
      toast.error(getErrorMessage(err))
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('Anchor story set')
    },
  })
}

export function useSetAnchorStoryPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      points,
    }: {
      sessionId: string
      points: number | null
    }) => {
      const result = await setAnchorStoryPoints(sessionId, points)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async ({ sessionId, points }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })

      // Find the session code for this sessionId
      const sessionQueries = queryClient.getQueriesData({
        queryKey: sessionKeys.all,
      })
      let sessionCode: string | undefined
      let previousSession: PlanningSession | undefined

      for (const [, sessionData] of sessionQueries) {
        if (isPlanningSession(sessionData) && sessionData.id === sessionId) {
          sessionCode = sessionData.code
          previousSession = sessionData
          break
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically update anchor story points
      const updatedSession = {
        ...(previousSession as PlanningSession),
        anchorStoryPoints: points,
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousSession && context?.sessionCode) {
        queryClient.setQueryData(
          sessionKeys.byCode(context.sessionCode),
          context.previousSession
        )
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('Anchor story points updated')
    },
  })
}
