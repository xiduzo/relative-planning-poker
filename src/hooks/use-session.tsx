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
import { CreateStoryInput, PlanningSession, SESSION_CODE_LENGTH } from '@/types'
import { ANCHOR_POSITION, positionRelativeToAnchor } from '@/utils'
import {
  DraftingCompassIcon,
  RocketIcon,
  ShredderIcon,
  SparkleIcon,
  TelescopeIcon,
} from 'lucide-react'
import { getRandomItem } from '@/utils/array'

function isPlanningSession(value: unknown): value is PlanningSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<PlanningSession>
  return (
    typeof session.id === 'string' &&
    typeof session.code === 'string' &&
    Array.isArray(session.stories)
  )
}

const successMessages = [
  'Roger that',
  'Got it',
  'Understood',
  'Affirmative',
  'All set',
  'Done',
  'Confirmed',
  'Accepted',
  'Ready',
]

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
    enabled: !!code && code.length === SESSION_CODE_LENGTH,
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
      toast.success(getRandomItem(successMessages), {
        description: 'Ready to launch!',
        icon: <RocketIcon size={16} />,
      })
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
      ) as PlanningSession | undefined

      // Optimistically update the session
      if (isPlanningSession(previousSession)) {
        const isFirstStory = previousSession.stories.length === 0
        const optimisticStory = {
          id: `temp-${Date.now()}`, // Temporary ID
          title: input.title,
          description: input.description ?? '',
          position: ANCHOR_POSITION, // Will be set by server
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
      if (!context) return
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        sessionKeys.byCode(context.sessionCode),
        context.previousSession
      )
      toast.error(getErrorMessage(err))
    },
    onSuccess: (response, _variables, context) => {
      if ('data' in response) {
        queryClient.setQueryData(
          sessionKeys.byCode(context?.sessionCode ?? ''),
          response.data
        )
      }
      toast.success(getRandomItem(successMessages), {
        description: 'Story added',
        icon: <SparkleIcon size={16} />,
      })
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
          if (stories.some(story => story.id === storyId)) {
            sessionCode = sessionData.code
            previousSession = sessionData
            break
          }
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically update the story
      const updatedSession = {
        ...previousSession,
        stories: previousSession.stories.map(story =>
          story.id === storyId
            ? { ...story, ...updates, updatedAt: new Date() }
            : story
        ),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      if (!context) return
      // Roll back on error
      queryClient.setQueryData(
        sessionKeys.byCode(context.sessionCode),
        context.previousSession
      )
      toast.error(getErrorMessage(err))
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success(getRandomItem(successMessages), {
        description: 'Story updated',
        icon: <DraftingCompassIcon size={16} />,
      })
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
          if (stories.some(story => story.id === storyId)) {
            sessionCode = sessionData.code
            previousSession = sessionData
            break
          }
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically update the story position
      const updatedSession = {
        ...previousSession,
        stories: previousSession.stories.map(story =>
          story.id === storyId
            ? { ...story, position, updatedAt: new Date() }
            : story
        ),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      if (!context) return
      // Roll back on error
      queryClient.setQueryData(
        sessionKeys.byCode(context.sessionCode),
        context.previousSession
      )
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
          if (stories.some(story => story.id === storyId)) {
            sessionCode = sessionData.code
            previousSession = sessionData
            break
          }
        }
      }

      if (!sessionCode || !previousSession) return

      // Optimistically remove the story
      const updatedSession = {
        ...previousSession,
        stories: previousSession.stories.filter(story => story.id !== storyId),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      if (!context) return
      // Roll back on error
      queryClient.setQueryData(
        sessionKeys.byCode(context.sessionCode),
        context.previousSession
      )
      toast.error(getErrorMessage(err))
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success(getRandomItem(successMessages), {
        description: 'Story deleted',
        icon: <ShredderIcon size={16} />,
      })
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
        ...previousSession,
        anchorStoryId: storyId,
        stories: previousSession.stories.map(story => ({
          ...story,
          isAnchor: story.id === storyId,
          // Position will be updated by server
        })),
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(
        sessionKeys.byCode(context.sessionCode),
        context.previousSession
      )
      toast.error(getErrorMessage(err))
    },
    onSuccess: (_response, variables, context) => {
      const newAnchorStory = context?.previousSession?.stories.find(
        story => story.id === variables.storyId
      )
      if (!newAnchorStory) return

      context?.previousSession?.stories.forEach(async story => {
        if (story.id === variables.storyId) return
        const relativePosition = positionRelativeToAnchor(story, newAnchorStory)
        updateStoryPosition(story.id, relativePosition)
      })
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success(getRandomItem(successMessages), {
        description: 'Anchor story set',
        icon: <SparkleIcon size={16} />,
      })
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
        ...previousSession,
        anchorStoryPoints: points,
      }

      queryClient.setQueryData(sessionKeys.byCode(sessionCode), updatedSession)

      return { previousSession, sessionCode }
    },
    onError: (err, variables, context) => {
      if (!context) return
      // Roll back on error
      queryClient.setQueryData(
        sessionKeys.byCode(context.sessionCode),
        context.previousSession
      )
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success(getRandomItem(successMessages), {
        description: 'Anchor story points updated',
        icon: <TelescopeIcon size={16} />,
      })
    },
  })
}
