/**
 * Utility functions for story position calculations and normalization
 */

import type { Story, Position2D } from '../types'
import { POSITION_MIN, POSITION_MAX } from '../types'

// Additional constants for position calculations
export const ANCHOR_POSITION: Position2D = { x: 0, y: 0 }
export const DEFAULT_SPACING = 10

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
 * Normalizes a single position value to be within the valid range (for backward compatibility)
 */
export function normalizePosition(position: number): number {
  return Math.max(POSITION_MIN, Math.min(POSITION_MAX, position))
}

/**
 * Calculates the relative position between two stories in 2D space
 */
export function calculateRelativePosition2D(
  story1: Story,
  story2: Story,
  ratio: number = 0.5
): Position2D {
  const pos1 = story1.position
  const pos2 = story2.position

  const newPosition: Position2D = {
    x: pos1.x + (pos2.x - pos1.x) * ratio,
    y: pos1.y + (pos2.y - pos1.y) * ratio,
  }

  return normalizePosition2D(newPosition)
}

/**
 * Calculates the distance between two 2D positions
 */
export function calculateDistance2D(
  position1: Position2D,
  position2: Position2D
): number {
  const dx = position2.x - position1.x
  const dy = position2.y - position1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Finds the closest story to a given 2D position
 */
export function findClosestStory2D(
  stories: Story[],
  targetPosition: Position2D
): Story | null {
  if (stories.length === 0) {
    return null
  }

  return stories.reduce((closest, current) => {
    const currentDistance = calculateDistance2D(
      current.position,
      targetPosition
    )
    const closestDistance = calculateDistance2D(
      closest.position,
      targetPosition
    )

    return currentDistance < closestDistance ? current : closest
  })
}

/**
 * Checks if two stories are too close together in 2D space
 */
export function areStoriesOverlapping2D(
  story1: Story,
  story2: Story,
  minSpacing: number = 10
): boolean {
  return calculateDistance2D(story1.position, story2.position) < minSpacing
}

/**
 * Snaps a 2D position to the nearest valid grid position
 */
export function snapToGrid2D(
  position: Position2D,
  gridSize: number = 5
): Position2D {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}

/**
 * Converts a 2D position to percentage coordinates for CSS positioning
 */
export function positionToPercentage(position: Position2D): {
  left: string
  top: string
} {
  // Convert from -100 to 100 range to 0% to 100% range
  const leftPercentage = ((position.x + 100) / 200) * 100
  const topPercentage = ((position.y + 100) / 200) * 100

  return {
    left: `${Math.max(0, Math.min(100, leftPercentage))}%`,
    top: `${Math.max(0, Math.min(100, topPercentage))}%`,
  }
}

/**
 * Converts pixel coordinates to 2D position coordinates
 */
export function pixelsToPosition2D(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number
): Position2D {
  // Convert from pixel coordinates to -100 to 100 range
  const positionX = (x / containerWidth) * 200 - 100
  const positionY = (y / containerHeight) * 200 - 100

  return normalizePosition2D({ x: positionX, y: positionY })
}

/**
 * @deprecated Use calculateDistance2D instead
 */
export function calculateDistance(
  position1: number,
  position2: number
): number {
  return Math.abs(position1 - position2)
}

/**
 * @deprecated Use areStoriesOverlapping2D instead
 */
export function areStoriesOverlapping(
  story1: Story,
  story2: Story,
  minSpacing: number = 2
): boolean {
  return Math.abs(story1.position.x - story2.position.x) < minSpacing
}

/**
 * Calculate exponential score for a single axis
 * @param value - The position value (-100 to 100)
 * @param isLowerBetter - Whether lower values should get higher scores
 * @returns Score from 0 to 5
 */
function calculateAxisScore(value: number, isLowerBetter: boolean): number {
  const BASE_SCORE = 5
  const EXPONENTIAL = 1.65

  // Normalize to 0-1 range
  const normalized = (value - POSITION_MIN) / (POSITION_MAX - POSITION_MIN)

  // For lower-is-better axes, invert the normalized value
  const adjustedValue = isLowerBetter ? 1 - normalized : normalized

  return BASE_SCORE * Math.pow(adjustedValue, EXPONENTIAL)
}

/**
 * Calculate total exponential score for a position
 * @param position - The 2D position
 * @returns Total score (0-10, where higher is better)
 */
export function calculatePositionScore(position: Position2D): number {
  // X-axis: lower is better (complexity)
  const xScore = calculateAxisScore(position.x, true)

  // Y-axis: higher is better (uncertainty), so higher Y gives fewer points
  const yScore = calculateAxisScore(position.y, false)

  return xScore + yScore
}
