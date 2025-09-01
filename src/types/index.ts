/**
 * Core data models and Zod schemas for Pokernaut
 */

import { z } from 'zod'

// Constants for validation
export const POSITION_MIN = -100
export const POSITION_MAX = 100
export const POSITION_RANGE = POSITION_MAX - POSITION_MIN
export const STORY_TITLE_MAX_LENGTH = 100
export const STORY_DESCRIPTION_MAX_LENGTH = 500
export const SESSION_NAME_MAX_LENGTH = 50
export const SESSION_CODE_LENGTH = 6

export const FIBONACCI_NUMBERS = [1, 2, 3, 5, 8, 13, 21, 34, 55] as const
export const FibonacciNumberSchema = z.union([
  ...FIBONACCI_NUMBERS.map(x => z.literal(x)),
  z.null(),
])

// 2D Position type for complexity and uncertainty
export const Position2DSchema = z.object({
  x: z
    .number()
    .min(
      POSITION_MIN,
      `X position must be between ${POSITION_MIN} and ${POSITION_MAX}`
    )
    .max(
      POSITION_MAX,
      `X position must be between ${POSITION_MIN} and ${POSITION_MAX}`
    ),
  y: z
    .number()
    .min(
      POSITION_MIN,
      `Y position must be between ${POSITION_MIN} and ${POSITION_MAX}`
    )
    .max(
      POSITION_MAX,
      `Y position must be between ${POSITION_MIN} and ${POSITION_MAX}`
    ),
})

// Zod schemas
export const StorySchema = z.object({
  id: z.string().min(1, 'Story ID is required'),
  title: z
    .string()
    .trim()
    .min(1, 'Story title is required')
    .max(
      STORY_TITLE_MAX_LENGTH,
      `Story title must be ${STORY_TITLE_MAX_LENGTH} characters or less`
    ),
  description: z
    .string()
    .trim()
    .max(
      STORY_DESCRIPTION_MAX_LENGTH,
      `Story description must be ${STORY_DESCRIPTION_MAX_LENGTH} characters or less`
    ),
  position: Position2DSchema,
  isAnchor: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const ParticipantSchema = z.object({
  id: z.string().trim().min(1, 'Participant ID is required'),
  name: z.string().trim().min(1, 'Participant name is required'),
  color: z.string().trim().min(1, 'Participant color is required'),
  isActive: z.boolean().default(true),
  cursor: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
})

export const PlanningSessionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Session name is required')
      .max(
        SESSION_NAME_MAX_LENGTH,
        `Session name must be ${SESSION_NAME_MAX_LENGTH} characters or less`
      ),
    code: z
      .string()
      .trim()
      .min(SESSION_CODE_LENGTH, 'Session code must be 6 characters long')
      .max(SESSION_CODE_LENGTH, 'Session code must be 6 characters long'),
    stories: z.array(StorySchema).default([]),
    anchorStoryId: z.string().nullable().default(null),
    anchorStoryPoints: FibonacciNumberSchema.nullable().default(null),
    createdAt: z.date(),
    lastModified: z.date(),
  })
  .refine(
    data => {
      // Validate anchor story requirements
      const anchorStories = data.stories.filter(story => story.isAnchor)
      if (data.stories.length > 0 && anchorStories.length === 0) {
        return false
      }
      if (anchorStories.length > 1) {
        return false
      }
      return true
    },
    {
      message: 'Session must have exactly one anchor story when stories exist',
    }
  )

export const ExportDataSchema = z.object({
  sessionName: z.string(),
  exportedAt: z.date(),
  stories: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      storyPoints: z.number().nullable(),
      relativePosition: z.number(),
    })
  ),
  totalStories: z.number().min(0),
})

// Input schemas for create/update operations
export const CreateStoryInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Story title is required')
    .max(
      STORY_TITLE_MAX_LENGTH,
      `Story title must be ${STORY_TITLE_MAX_LENGTH} characters or less`
    ),
  description: z
    .string()
    .trim()
    .max(
      STORY_DESCRIPTION_MAX_LENGTH,
      `Story description must be ${STORY_DESCRIPTION_MAX_LENGTH} characters or less`
    ),
})

export const UpdateStoryInputSchema = z.object({
  id: z.string().min(1, 'Story ID is required for updates'),
  title: z
    .string()
    .trim()
    .min(1, 'Story title is required')
    .max(
      STORY_TITLE_MAX_LENGTH,
      `Story title must be ${STORY_TITLE_MAX_LENGTH} characters or less`
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(
      STORY_DESCRIPTION_MAX_LENGTH,
      `Story description must be ${STORY_DESCRIPTION_MAX_LENGTH} characters or less`
    )
    .optional(),
  position: Position2DSchema.optional(),
})

// TypeScript types inferred from Zod schemas
export type Position2D = z.infer<typeof Position2DSchema>
export type Story = z.infer<typeof StorySchema>
export type Participant = z.infer<typeof ParticipantSchema>
export type PlanningSession = z.infer<typeof PlanningSessionSchema>
export type ExportData = z.infer<typeof ExportDataSchema>
export type CreateStoryInput = z.infer<typeof CreateStoryInputSchema>
export type UpdateStoryInput = z.infer<typeof UpdateStoryInputSchema>
export type FibonacciNumber = z.infer<typeof FibonacciNumberSchema>

// Validation result types (keeping these for consistency with existing code)
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
