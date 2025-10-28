/**
 * Core app types derived from DB and simple TypeScript interfaces.
 * Zod validation has been removed; DB constraints enforce integrity.
 */

import type { Session as DbSession, Story as DbStory } from '@/db/schema'

// Constants for validation
export const POSITION_MIN = -100
export const POSITION_MAX = 100
export const POSITION_RANGE = POSITION_MAX - POSITION_MIN
export const STORY_TITLE_MAX_LENGTH = 100
export const STORY_DESCRIPTION_MAX_LENGTH = 500
export const SESSION_NAME_MAX_LENGTH = 50
export const SESSION_CODE_LENGTH = 6

export const FIBONACCI_NUMBERS = [1, 2, 3, 5, 8, 13, 21, 34, 55] as const
export type FibonacciNumber = (typeof FIBONACCI_NUMBERS)[number]

// 2D Position type for complexity and uncertainty
export interface Position2D {
  x: number
  y: number
}

// App-facing Story
export interface Story {
  id: string
  title: string
  description: string
  position: Position2D
  isAnchor: boolean
  createdAt: Date
  updatedAt: Date
}

// Participant type (kept as a plain TS interface for future use)
export interface Participant {
  id: string
  name: string
  color: string
  isActive: boolean
  cursor?: { x: number; y: number }
}

// App-facing session
export interface PlanningSession {
  id: string
  name: string
  code: string
  stories: Story[]
  anchorStoryId: string | null
  anchorStoryPoints: number | null
  createdAt: Date
  lastModified: Date
}

export interface ExportData {
  sessionName: string
  exportedAt: Date
  stories: Array<{
    title: string
    description: string
    storyPoints: number | null
    relativePosition: number
  }>
  totalStories: number
}

// Input schemas for create/update operations
export interface CreateStoryInput {
  title: string
  description: string
}

export interface UpdateStoryInput {
  id: string
  title?: string
  description?: string
  position?: Position2D
}

// Re-export DB-inferred types for server layer usage
export type DatabaseSession = DbSession
export type DatabaseStory = DbStory
