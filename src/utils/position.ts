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
 * Calculates the relative position of a story to an anchor story
 * @param story - The story to calculate the relative position for
 * @param anchorStory - The anchor story
 * @returns The relative position
 */
export function positionRelativeToAnchor(
  story: Story,
  anchorStory: Story
): Position2D {
  return normalizePosition2D({
    x: story.position.x - anchorStory.position.x,
    y: story.position.y - anchorStory.position.y,
  })
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
 * @returns Total score (0 to 10, where 5 is neutral, 0 is worst, 10 is best)
 */
export function calculatePositionScore(position: Position2D): number {
  // X-axis: lower is better (complexity)
  const xScore = calculateAxisScore(position.x, true)

  // Y-axis: higher is better (uncertainty), so higher Y gives fewer points
  const yScore = calculateAxisScore(position.y, false)

  return xScore + yScore
}

/**
 * Calculate story points for a story based on its position relative to the anchor
 * @param story - The story to calculate points for
 * @param anchorStoryPoints - The story points assigned to the anchor story
 * @returns The calculated story points (Fibonacci number)
 */
export function calculateStoryPoints(
  story: Story,
  anchorStoryPoints: FibonacciNumber | null = null
): number | null {
  if (!anchorStoryPoints) return null

  // If this is the anchor story, return the assigned story points
  if (story.isAnchor) return anchorStoryPoints

  // Find the anchor story's position in the Fibonacci sequence
  const anchorIndex = FIBONACCI_NUMBERS.indexOf(anchorStoryPoints)
  if (anchorIndex === -1) {
    throw new Error(
      `Anchor story points ${anchorStoryPoints} not found in Fibonacci sequence`
    )
  }

  // Create a custom scoring system for this coordinate system:
  // - Lower X (left) = good (lower complexity) → lower score
  // - Higher Y (top) = good (less uncertainty) → lower score
  // - Higher X (right) = bad (higher complexity) → higher score
  // - Lower Y (bottom) = bad (more uncertainty) → higher score

  // Normalize X and Y to 0-1 range where 0 = good, 1 = bad
  const xScore = (story.position.x + POSITION_RANGE / 2) / POSITION_RANGE // -100→0 (good), 100→1 (bad)
  const yScore = (POSITION_RANGE / 2 - story.position.y) / POSITION_RANGE // 100→0 (good), -100→1 (bad)

  // Combine scores: higher total score = worse position = higher story points
  // Give complexity (X) more weight than uncertainty (Y) since complexity has more impact on story points
  const COMPLEXITY_WEIGHT = 0.7
  const UNCERTAINTY_WEIGHT = 0.3
  const positionScore = xScore * COMPLEXITY_WEIGHT + yScore * UNCERTAINTY_WEIGHT // 0 = best, 1 = worst

  // Calculate the position score (0-1) for the anchor story (should be at 0,0)
  const anchorScore = (0 + POSITION_RANGE / 2) / POSITION_RANGE // (0 + 100) / 200 = 0.5*

  // Calculate the difference in scores
  // Higher position scores (worse positions) should result in higher story points
  const scoreDifference = positionScore - anchorScore

  // Convert score difference to percentage change (score range is 0-1)
  const percentageChange = scoreDifference * ONE_HUNDRED_PERCENT

  // For every 10% change, move 1 stage up or down the Fibonacci ladder
  // Positive difference (worse position) moves up, negative difference (better position) moves down
  const PERCENTAGE_CHANGE_PER_STAGE = 10
  const fibonacciStagesToMove = Math.round(
    percentageChange / PERCENTAGE_CHANGE_PER_STAGE
  )

  // Calculate the new index
  const newIndex = anchorIndex + fibonacciStagesToMove

  // Ensure the index is within bounds
  const clampedIndex = Math.max(
    0,
    Math.min(FIBONACCI_NUMBERS.length - 1, newIndex)
  )

  return FIBONACCI_NUMBERS[clampedIndex]
}
