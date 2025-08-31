/**
 * Utility functions for story position calculations and normalization
 */

import type { Story, Position2D, FibonacciNumber } from '../types'
import {
  POSITION_MIN,
  POSITION_MAX,
  POSITION_RANGE,
  FIBONACCI_NUMBERS,
} from '../types'

// Additional constants for position calculations
export const ANCHOR_POSITION: Position2D = { x: 0, y: 0 }
export const DEFAULT_SPACING = 10
const ONE_HUNDRED_PERCENT = 100
const MAX_SCORE = 10
const BASE_SCORE = MAX_SCORE / 2

/**
 * Normalizes a 2D position value to be within the valid range
 */
export function normalizePosition2D(position: Position2D): Position2D {
  return {
    x: Math.max(POSITION_MIN, Math.min(POSITION_MAX, position.x)),
    y: Math.max(POSITION_MIN, Math.min(POSITION_MAX, position.y)),
  }
}

/**
 * Converts a 2D position to percentage coordinates for CSS positioning
 */
export function positionToPercentage(position: Position2D): {
  left: string
  top: string
} {
  const leftPercentage =
    ((position.x + POSITION_MAX) / POSITION_RANGE) * ONE_HUNDRED_PERCENT
  const topPercentage =
    ((position.y + POSITION_MAX) / POSITION_RANGE) * ONE_HUNDRED_PERCENT

  return {
    left: `${Math.max(0, Math.min(ONE_HUNDRED_PERCENT, leftPercentage))}%`,
    top: `${Math.max(0, Math.min(ONE_HUNDRED_PERCENT, topPercentage))}%`,
  }
}

/**
 * Calculate exponential score for a single axis
 * @param value - The position value (-100 to 100)
 * @param isLowerBetter - Whether lower values should get higher scores
 * @returns Score from 0 to 5
 */
function calculateAxisScore(value: number, isLowerBetter: boolean): number {
  const EXPONENTIAL = 1.65

  // Normalize to 0-1 range
  const normalized = (value - POSITION_MIN) / POSITION_RANGE

  // For lower-is-better axes, invert the normalized value
  const adjustedValue = isLowerBetter ? 1 - normalized : normalized

  const score = BASE_SCORE * Math.pow(adjustedValue, EXPONENTIAL)
  if (Number.isNaN(score)) return 0 // We are out of bounds
  return score
}

/**
 * Calculate total exponential score for a position
 * @param position - The 2D position
 * @returns Total score (0 to 10, where 5 is neutral)
 */
export function calculatePositionScore(position: Position2D): number {
  // X-axis: lower is better (complexity)
  const xScore = calculateAxisScore(position.x, true)

  // Y-axis: higher is better (uncertainty), so higher Y gives fewer points
  const yScore = calculateAxisScore(position.y, false)

  return xScore + yScore
}

/**
 * Adjusts story positions relative to a new anchor story
 * @param stories - Array of all stories
 * @param newAnchorStoryId - ID of the story to become the new anchor
 * @param anchorPosition - Position where the new anchor should be placed (defaults to 0,0)
 * @returns Array of stories with adjusted positions
 */
export function adjustStoriesRelativeToNewAnchor(
  stories: Story[],
  newAnchorStoryId: string,
  anchorPosition: Position2D = ANCHOR_POSITION
): Story[] {
  const currentAnchorStory = stories.find(s => s.isAnchor)
  const now = new Date()

  return stories.map(story => {
    if (story.id === newAnchorStoryId) {
      // This is the new anchor story - move it to the anchor position
      return {
        ...story,
        position: anchorPosition,
        isAnchor: true,
        updatedAt: now,
      }
    }

    if (!currentAnchorStory) {
      // No previous anchor, keep current position but ensure isAnchor is false
      return {
        ...story,
        isAnchor: false,
        updatedAt: now,
      }
    }

    // Calculate the relative position from the old anchor to this story
    const relativeX = story.position.x - currentAnchorStory.position.x
    const relativeY = story.position.y - currentAnchorStory.position.y

    // Apply the same relative position from the new anchor
    const newPosition = normalizePosition2D({
      x: anchorPosition.x + relativeX,
      y: anchorPosition.y + relativeY,
    })

    return {
      ...story,
      position: newPosition,
      isAnchor: false,
      updatedAt: now,
    }
  })
}

/**
 * Calculate story points for a story based on its distance from the anchor story
 * @param story - The story to calculate points for
 * @param anchorStory - The anchor story
 * @param anchorStoryPoints - The story points assigned to the anchor story
 * @returns The calculated story points (Fibonacci number)
 */
export function calculateStoryPoints(
  story: Story,
  anchorStory?: Story | null,
  anchorStoryPoints: FibonacciNumber | null = null
): number | null {
  if (!anchorStory) return null
  if (!anchorStoryPoints) return null
  if (story.id === anchorStory.id) return anchorStoryPoints

  const score = calculatePositionScore(story.position)

  // if the score is > BASE SCORE, we need to scale the points up
  // if the score is < BASE SCORE, we need to scale the points down

  const anchorPointsIndex = FIBONACCI_NUMBERS.indexOf(anchorStoryPoints)

  if (anchorPointsIndex === -1) throw Error('Anchor story points not found')

  const RELATIVE_SCORE_MIN = 1.25
  const relativeScore = BASE_SCORE - score
  const relativeScorePercentage =
    ((relativeScore - RELATIVE_SCORE_MIN) / BASE_SCORE) * 100

  // Calculate the direction and available range
  const isDecreasing = relativeScorePercentage <= 0
  const availableIndexes = isDecreasing
    ? anchorPointsIndex
    : FIBONACCI_NUMBERS.length - anchorPointsIndex

  const index = Math.floor(
    (Math.abs(relativeScorePercentage) * availableIndexes) / 100
  )
  const newIndex = isDecreasing
    ? anchorPointsIndex - index
    : anchorPointsIndex + index

  const newPoints =
    FIBONACCI_NUMBERS[
      // The new index can me min 0 and max FIBONACCI_NUMBERS.length - 1
      Math.max(0, Math.min(FIBONACCI_NUMBERS.length - 1, newIndex))
    ]

  return newPoints
}
