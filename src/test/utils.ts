/**
 * Test utilities and helpers
 */

import { fromPartial } from '@total-typescript/shoehorn'
import type { Story, PlanningSession, PointCutoff, Participant } from '../types'

/**
 * Creates a partial Story object for testing
 */
export function createTestStory(partial: Partial<Story> = {}): Story {
  return fromPartial<Story>({
    id: 'test-story-1',
    title: 'Test Story',
    description: 'Test description',
    position: { x: 0, y: 0 },
    isAnchor: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...partial,
  })
}

/**
 * Creates a partial PlanningSession object for testing
 */
export function createTestSession(
  partial: Partial<PlanningSession> = {}
): PlanningSession {
  return fromPartial<PlanningSession>({
    id: 'test-session-1',
    name: 'Test Session',
    stories: [],
    anchorStoryId: null,
    pointCutoffs: [],
    isPointAssignmentMode: false,
    createdAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
    ...partial,
  })
}

/**
 * Creates a partial PointCutoff object for testing
 */
export function createTestPointCutoff(
  partial: Partial<PointCutoff> = {}
): PointCutoff {
  return fromPartial<PointCutoff>({
    id: 'test-cutoff-1',
    position: { x: 0, y: 0 },
    pointValue: 5,
    label: '5 points',
    ...partial,
  })
}

/**
 * Creates a partial Participant object for testing
 */
export function createTestParticipant(
  partial: Partial<Participant> = {}
): Participant {
  return fromPartial<Participant>({
    id: 'test-participant-1',
    name: 'Test User',
    color: '#ff0000',
    isActive: true,
    ...partial,
  })
}
