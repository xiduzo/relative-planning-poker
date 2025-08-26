/**
 * Utility functions for story position calculations and normalization
 */

import type { Story } from '../types';
import { POSITION_MIN, POSITION_MAX } from '../types';

// Additional constants for position calculations
export const ANCHOR_POSITION = 0;
export const DEFAULT_SPACING = 10;

/**
 * Normalizes a position value to be within the valid range
 */
export function normalizePosition(position: number): number {
  return Math.max(POSITION_MIN, Math.min(POSITION_MAX, position));
}

/**
 * Calculates the relative position between two stories
 */
export function calculateRelativePosition(
  leftStory: Story,
  rightStory: Story,
  ratio: number = 0.5
): number {
  const leftPos = leftStory.position;
  const rightPos = rightStory.position;
  
  // Ensure left position is actually to the left of right position
  if (leftPos >= rightPos) {
    throw new Error('Left story must have a lower position than right story');
  }
  
  const newPosition = leftPos + (rightPos - leftPos) * ratio;
  return normalizePosition(newPosition);
}

/**
 * Finds the optimal position for a new story between existing stories
 */
export function findOptimalPosition(
  stories: Story[],
  targetPosition: number
): number {
  if (stories.length === 0) {
    return ANCHOR_POSITION;
  }

  const sortedStories = [...stories].sort((a, b) => a.position - b.position);
  const normalizedTarget = normalizePosition(targetPosition);

  // If target is before all stories
  if (normalizedTarget <= sortedStories[0].position) {
    const firstPos = sortedStories[0].position;
    return normalizePosition(firstPos - DEFAULT_SPACING);
  }

  // If target is after all stories
  if (normalizedTarget >= sortedStories[sortedStories.length - 1].position) {
    const lastPos = sortedStories[sortedStories.length - 1].position;
    return normalizePosition(lastPos + DEFAULT_SPACING);
  }

  // Find the two stories that the target position falls between
  for (let i = 0; i < sortedStories.length - 1; i++) {
    const leftStory = sortedStories[i];
    const rightStory = sortedStories[i + 1];

    if (normalizedTarget >= leftStory.position && normalizedTarget <= rightStory.position) {
      // Calculate position between the two stories
      const gap = rightStory.position - leftStory.position;
      
      // If there's enough space, use the target position
      if (gap > 2) {
        return normalizedTarget;
      }
      
      // Otherwise, calculate the midpoint
      return calculateRelativePosition(leftStory, rightStory, 0.5);
    }
  }

  // Fallback to target position if no suitable gap found
  return normalizedTarget;
}

/**
 * Redistributes story positions to prevent clustering
 */
export function redistributePositions(stories: Story[]): Story[] {
  if (stories.length <= 1) {
    return stories;
  }

  const sortedStories = [...stories].sort((a, b) => a.position - b.position);
  const anchorStory = sortedStories.find(story => story.isAnchor);
  
  if (!anchorStory) {
    throw new Error('No anchor story found for redistribution');
  }

  const anchorIndex = sortedStories.findIndex(story => story.isAnchor);
  const totalRange = POSITION_MAX - POSITION_MIN;
  const spacing = totalRange / (sortedStories.length + 1);

  return sortedStories.map((story, index) => {
    if (story.isAnchor) {
      return story; // Keep anchor position unchanged
    }

    // Calculate new position relative to anchor
    const relativeIndex = index - anchorIndex;
    const newPosition = ANCHOR_POSITION + (relativeIndex * spacing);
    
    return {
      ...story,
      position: normalizePosition(newPosition),
      updatedAt: new Date()
    };
  });
}

/**
 * Calculates the distance between two positions
 */
export function calculateDistance(position1: number, position2: number): number {
  return Math.abs(position1 - position2);
}

/**
 * Finds the closest story to a given position
 */
export function findClosestStory(stories: Story[], targetPosition: number): Story | null {
  if (stories.length === 0) {
    return null;
  }

  return stories.reduce((closest, current) => {
    const currentDistance = calculateDistance(current.position, targetPosition);
    const closestDistance = calculateDistance(closest.position, targetPosition);
    
    return currentDistance < closestDistance ? current : closest;
  });
}

/**
 * Checks if two stories are too close together (within minimum spacing)
 */
export function areStoriesOverlapping(story1: Story, story2: Story, minSpacing: number = 2): boolean {
  return calculateDistance(story1.position, story2.position) < minSpacing;
}

/**
 * Snaps a position to the nearest valid grid position
 */
export function snapToGrid(position: number, gridSize: number = 5): number {
  const snapped = Math.round(position / gridSize) * gridSize;
  return normalizePosition(snapped);
}