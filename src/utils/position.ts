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
 * Finds the optimal position for a new story between existing stories
 */
export function findOptimalPosition(
  stories: Story[],
  targetPosition: number
): number {
  if (stories.length === 0) {
    return ANCHOR_POSITION.x
  }

  const sortedStories = [...stories].sort((a, b) => a.position.x - b.position.x)
  const normalizedTarget = normalizePosition(targetPosition)

  // If target is before all stories
  if (normalizedTarget <= sortedStories[0].position.x) {
    const firstPos = sortedStories[0].position.x
    return normalizePosition(firstPos - DEFAULT_SPACING)
  }

  // If target is after all stories
  if (normalizedTarget >= sortedStories[sortedStories.length - 1].position.x) {
    const lastPos = sortedStories[sortedStories.length - 1].position.x
    return normalizePosition(lastPos + DEFAULT_SPACING)
  }

  // Find the two stories that the target position falls between
  for (let i = 0; i < sortedStories.length - 1; i++) {
    const leftStory = sortedStories[i]
    const rightStory = sortedStories[i + 1]

    if (
      normalizedTarget >= leftStory.position.x &&
      normalizedTarget <= rightStory.position.x
    ) {
      // Calculate position between the two stories
      const gap = rightStory.position.x - leftStory.position.x

      // If there's enough space, use the target position
      if (gap > 2) {
        return normalizedTarget
      }

      // Otherwise, calculate the midpoint
      return calculateRelativePosition2D(leftStory, rightStory, 0.5).x
    }
  }

  // Fallback to target position if no suitable gap found
  return normalizedTarget
}

/**
 * Redistributes story positions to prevent clustering
 */
export function redistributePositions(stories: Story[]): Story[] {
  if (stories.length <= 1) {
    return stories
  }

  const sortedStories = [...stories].sort((a, b) => a.position.x - b.position.x)
  const anchorStory = sortedStories.find(story => story.isAnchor)

  if (!anchorStory) {
    throw new Error('No anchor story found for redistribution')
  }

  const anchorIndex = sortedStories.findIndex(story => story.isAnchor)
  const totalRange = POSITION_MAX - POSITION_MIN
  const spacing = totalRange / (sortedStories.length + 1)

  return sortedStories.map((story, index) => {
    if (story.isAnchor) {
      return story // Keep anchor position unchanged
    }

    // Calculate new position relative to anchor
    const relativeIndex = index - anchorIndex
    const newPositionX = ANCHOR_POSITION.x + relativeIndex * spacing

    return {
      ...story,
      position: normalizePosition2D({ x: newPositionX, y: story.position.y }),
      updatedAt: new Date(),
    }
  })
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

// Legacy functions for backward compatibility (deprecated)
/**
 * @deprecated Use calculateRelativePosition2D instead
 */
export function calculateRelativePosition(
  leftStory: Story,
  rightStory: Story,
  ratio: number = 0.5
): number {
  const leftPos = leftStory.position.x // Use x coordinate for complexity
  const rightPos = rightStory.position.x

  if (leftPos >= rightPos) {
    throw new Error('Left story must have a lower complexity than right story')
  }

  const newPosition = leftPos + (rightPos - leftPos) * ratio
  return normalizePosition(newPosition)
}

/**
 * @deprecated Use findClosestStory2D instead
 */
export function findClosestStory(
  stories: Story[],
  targetPosition: number
): Story | null {
  if (stories.length === 0) {
    return null
  }

  return stories.reduce((closest, current) => {
    const currentDistance = Math.abs(current.position.x - targetPosition)
    const closestDistance = Math.abs(closest.position.x - targetPosition)

    return currentDistance < closestDistance ? current : closest
  })
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
 * @deprecated Use snapToGrid2D instead
 */
export function snapToGrid(position: number, gridSize: number = 5): number {
  const snapped = Math.round(position / gridSize) * gridSize
  return normalizePosition(snapped)
}
