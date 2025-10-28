'use server'

import { db } from '@/db'
import { sessions, stories } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId, generateSessionCode } from '@/utils'
import { CreateStoryInput } from '@/types'
import { ANCHOR_POSITION } from '@/utils/position'

export async function createSession(name: string) {
  try {
    const sessionCode = generateSessionCode()
    const now = new Date()

    const [newSession] = await db
      .insert(sessions)
      .values({
        name,
        code: sessionCode,
        createdAt: now,
        lastModified: now,
      })
      .returning()

    return {
      success: true,
      data: {
        id: newSession.id,
        name: newSession.name,
        code: newSession.code,
        stories: [],
        anchorStoryId: null,
        anchorStoryPoints: null,
        createdAt: newSession.createdAt,
        lastModified: newSession.lastModified,
      },
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to create session',
    }
  }
}

export async function getSessionByCode(code: string) {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.code, code),
      with: {
        stories: {
          orderBy: stories.createdAt,
        },
      },
    })

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      }
    }

    // Transform to match app-facing PlanningSession type
    const transformedSession = {
      id: session.id,
      name: session.name,
      code: session.code,
      stories: session.stories.map(story => ({
        id: story.id,
        title: story.title,
        description: story.description,
        position: { x: story.positionX, y: story.positionY },
        isAnchor: story.isAnchor,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      })),
      anchorStoryId: session.anchorStoryId,
      anchorStoryPoints: session.anchorStoryPoints,
      createdAt: session.createdAt,
      lastModified: session.lastModified,
    }

    return {
      success: true,
      data: transformedSession,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to fetch session',
    }
  }
}

export async function addStory(sessionId: string, input: CreateStoryInput) {
  try {
    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Title is required' }
    }

    const now = new Date()
    const storyId = generateId()

    // Check if this is the first story
    const existingStories = await db.query.stories.findMany({
      where: eq(stories.sessionId, sessionId),
    })

    const isFirstStory = existingStories.length === 0

    const [newStory] = await db
      .insert(stories)
      .values({
        id: storyId,
        sessionId,
        title: input.title,
        description: input.description,
        positionX: ANCHOR_POSITION.x,
        positionY: ANCHOR_POSITION.y,
        isAnchor: isFirstStory,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    console.log('newStory', newStory)
    // Update session anchor story if this is the first story
    if (isFirstStory) {
      await db
        .update(sessions)
        .set({
          anchorStoryId: storyId,
          lastModified: now,
        })
        .where(eq(sessions.id, sessionId))
    } else {
      await db
        .update(sessions)
        .set({ lastModified: now })
        .where(eq(sessions.id, sessionId))
    }

    // Return updated session
    return await getSessionByCode(
      (
        await db.query.sessions.findFirst({
          where: eq(sessions.id, sessionId),
          columns: { code: true },
        })
      )?.code || ''
    )
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to add story',
    }
  }
}

export async function updateStory(
  storyId: string,
  updates: { title?: string; description?: string }
) {
  try {
    const now = new Date()

    await db
      .update(stories)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(stories.id, storyId))

    // Update session lastModified
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, storyId),
      columns: { sessionId: true },
    })

    if (story) {
      await db
        .update(sessions)
        .set({ lastModified: now })
        .where(eq(sessions.id, story.sessionId))
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to update story',
    }
  }
}

export async function updateStoryPosition(
  storyId: string,
  position: { x: number; y: number }
) {
  try {
    const now = new Date()

    await db
      .update(stories)
      .set({
        positionX: Math.round(position.x),
        positionY: Math.round(position.y),
        updatedAt: now,
      })
      .where(eq(stories.id, storyId))

    // Update session lastModified
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, storyId),
      columns: { sessionId: true },
    })

    if (story) {
      await db
        .update(sessions)
        .set({ lastModified: now })
        .where(eq(sessions.id, story.sessionId))
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to update story position',
    }
  }
}

export async function deleteStory(storyId: string) {
  try {
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, storyId),
      columns: { sessionId: true, isAnchor: true },
    })

    if (!story) {
      return {
        success: false,
        error: 'Story not found',
      }
    }

    // Check if this is the anchor story and there are other stories
    const allStories = await db.query.stories.findMany({
      where: eq(stories.sessionId, story.sessionId),
    })

    if (story.isAnchor && allStories.length > 1) {
      return {
        success: false,
        error: 'Cannot delete anchor story when other stories exist',
      }
    }

    await db.delete(stories).where(eq(stories.id, storyId))

    // If we deleted the anchor story and there are remaining stories, promote another
    if (story.isAnchor && allStories.length > 1) {
      const remainingStories = allStories.filter(s => s.id !== storyId)
      const newAnchor = remainingStories.reduce((closest, current) => {
        const closestDistance = Math.sqrt(
          closest.positionX ** 2 + closest.positionY ** 2
        )
        const currentDistance = Math.sqrt(
          current.positionX ** 2 + current.positionY ** 2
        )
        return currentDistance < closestDistance ? current : closest
      })

      await db
        .update(stories)
        .set({ isAnchor: true })
        .where(eq(stories.id, newAnchor.id))

      await db
        .update(sessions)
        .set({
          anchorStoryId: newAnchor.id,
          lastModified: new Date(),
        })
        .where(eq(sessions.id, story.sessionId))
    } else {
      await db
        .update(sessions)
        .set({
          anchorStoryId: null,
          lastModified: new Date(),
        })
        .where(eq(sessions.id, story.sessionId))
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to delete story',
    }
  }
}

export async function setAnchorStory(sessionId: string, storyId: string) {
  try {
    const now = new Date()

    // Update all stories to remove anchor status
    await db
      .update(stories)
      .set({ isAnchor: false })
      .where(eq(stories.sessionId, sessionId))

    // Set the new anchor story
    await db
      .update(stories)
      .set({
        isAnchor: true,
        positionX: ANCHOR_POSITION.x,
        positionY: ANCHOR_POSITION.y,
        updatedAt: now,
      })
      .where(and(eq(stories.id, storyId), eq(stories.sessionId, sessionId)))

    // Update session
    await db
      .update(sessions)
      .set({
        anchorStoryId: storyId,
        lastModified: now,
      })
      .where(eq(sessions.id, sessionId))

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to set anchor story',
    }
  }
}

export async function setAnchorStoryPoints(
  sessionId: string,
  points: number | null
) {
  try {
    await db
      .update(sessions)
      .set({
        anchorStoryPoints: points,
        lastModified: new Date(),
      })
      .where(eq(sessions.id, sessionId))

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to set anchor story points',
    }
  }
}
