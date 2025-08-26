/**
 * Unit tests for position calculation utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Story } from '../../types';
import { POSITION_MIN, POSITION_MAX } from '../../types';
import { createTestStory } from '../../test/utils';
import {
  normalizePosition,
  calculateRelativePosition,
  findOptimalPosition,
  redistributePositions,
  calculateDistance,
  findClosestStory,
  areStoriesOverlapping,
  snapToGrid,
  ANCHOR_POSITION,
  DEFAULT_SPACING
} from '../position';

describe(normalizePosition.name, () => {
  it.each([
    [0, 0, 'zero position'],
    [50, 50, 'positive position within range'],
    [-50, -50, 'negative position within range'],
    [POSITION_MIN, POSITION_MIN, 'minimum boundary'],
    [POSITION_MAX, POSITION_MAX, 'maximum boundary']
  ])('should return %i as %i for %s', (input, expected) => {
    expect(normalizePosition(input)).toBe(expected);
  });

  it.each([
    [-150, POSITION_MIN, 'far below minimum'],
    [-101, POSITION_MIN, 'just below minimum']
  ])('should clamp %i to minimum value %i (%s)', (input, expected) => {
    expect(normalizePosition(input)).toBe(expected);
  });

  it.each([
    [150, POSITION_MAX, 'far above maximum'],
    [101, POSITION_MAX, 'just above maximum']
  ])('should clamp %i to maximum value %i (%s)', (input, expected) => {
    expect(normalizePosition(input)).toBe(expected);
  });
});

describe(calculateRelativePosition.name, () => {
  const leftStory = createTestStory({ id: 'left', position: -20 });
  const rightStory = createTestStory({ id: 'right', position: 20 });

  it.each([
    [0.5, 0, 'midpoint by default'],
    [0.25, -10, '25% of the way'],
    [0, -20, 'left edge (0% ratio)'],
    [1, 20, 'right edge (100% ratio)']
  ])('should calculate position with ratio %f as %i (%s)', (ratio, expected, description) => {
    const result = calculateRelativePosition(leftStory, rightStory, ratio);
    expect(result).toBe(expected);
  });

  it('should throw error when left position is not less than right position', () => {
    const invalidLeftStory = createTestStory({ id: 'invalid', position: 30 });
    expect(() => calculateRelativePosition(invalidLeftStory, rightStory))
      .toThrow('Left story must have a lower position than right story');
  });

  it('should normalize result to valid range', () => {
    const farLeftStory = createTestStory({ id: 'farLeft', position: -90 });
    const farRightStory = createTestStory({ id: 'farRight', position: 90 });
    const result = calculateRelativePosition(farLeftStory, farRightStory);
    expect(result).toBe(0);
    expect(result).toBeGreaterThanOrEqual(POSITION_MIN);
    expect(result).toBeLessThanOrEqual(POSITION_MAX);
  });
});

describe(findOptimalPosition.name, () => {
  it('should return anchor position for empty story list', () => {
    const result = findOptimalPosition([], 50);
    expect(result).toBe(ANCHOR_POSITION);
  });

  it('should position before first story when target is leftmost', () => {
    const stories = [createTestStory({ id: '1', position: 10 })];
    const result = findOptimalPosition(stories, -50);
    expect(result).toBe(10 - DEFAULT_SPACING);
  });

  it('should position after last story when target is rightmost', () => {
    const stories = [createTestStory({ id: '1', position: -10 })];
    const result = findOptimalPosition(stories, 50);
    expect(result).toBe(-10 + DEFAULT_SPACING);
  });

  it('should use target position when there is enough space between stories', () => {
    const stories = [
      createTestStory({ id: '1', position: -20 }),
      createTestStory({ id: '2', position: 20 })
    ];
    const result = findOptimalPosition(stories, 0);
    expect(result).toBe(0);
  });

  it('should calculate midpoint when gap is too small', () => {
    const stories = [
      createTestStory({ id: '1', position: -1 }),
      createTestStory({ id: '2', position: 1 })
    ];
    const result = findOptimalPosition(stories, 0);
    expect(result).toBe(0); // Midpoint between -1 and 1
  });

  it('should handle multiple stories and find correct gap', () => {
    const stories = [
      createTestStory({ id: '1', position: -30 }),
      createTestStory({ id: '2', position: -10 }),
      createTestStory({ id: '3', position: 10 }),
      createTestStory({ id: '4', position: 30 })
    ];
    const result = findOptimalPosition(stories, 0);
    expect(result).toBe(0); // Between stories 2 and 3
  });
});

describe(redistributePositions.name, () => {
  it('should return unchanged for single story', () => {
    const stories = [createTestStory({ id: '1', position: 0, isAnchor: true })];
    const result = redistributePositions(stories);
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(0);
  });

  it('should throw error when no anchor story exists', () => {
    const stories = [
      createTestStory({ id: '1', position: 0 }),
      createTestStory({ id: '2', position: 10 })
    ];
    expect(() => redistributePositions(stories))
      .toThrow('No anchor story found for redistribution');
  });

  it('should keep anchor story position unchanged', () => {
    const stories = [
      createTestStory({ id: '1', position: -50 }),
      createTestStory({ id: '2', position: 0, isAnchor: true }), // anchor
      createTestStory({ id: '3', position: 50 })
    ];
    const result = redistributePositions(stories);
    const anchorStory = result.find(s => s.isAnchor);
    expect(anchorStory?.position).toBe(0);
  });

  it('should redistribute stories evenly around anchor', () => {
    const stories = [
      createTestStory({ id: '1', position: -90 }),
      createTestStory({ id: '2', position: 0, isAnchor: true }), // anchor
      createTestStory({ id: '3', position: 90 })
    ];
    const result = redistributePositions(stories);

    // Stories should be evenly spaced
    const sortedResult = result.sort((a, b) => a.position - b.position);
    expect(sortedResult[0].position).toBeLessThan(0); // Left of anchor
    expect(sortedResult[1].position).toBe(0); // Anchor
    expect(sortedResult[2].position).toBeGreaterThan(0); // Right of anchor
  });

  it('should update updatedAt timestamp for non-anchor stories', () => {
    const oldDate = new Date('2024-01-01');
    const stories = [
      createTestStory({ id: '1', position: -50, updatedAt: oldDate }),
      createTestStory({ id: '2', position: 0, isAnchor: true, updatedAt: oldDate })
    ];

    const result = redistributePositions(stories);
    const nonAnchorStory = result.find(s => !s.isAnchor);
    expect(nonAnchorStory?.updatedAt).not.toEqual(oldDate);
  });
});

describe(calculateDistance.name, () => {
  it.each([
    [0, 10, 10, 'positive positions'],
    [10, 0, 10, 'reversed positive positions'],
    [-10, 10, 20, 'negative to positive'],
    [10, -10, 20, 'positive to negative'],
    [5, 5, 0, 'same positions'],
    [-5, -5, 0, 'same negative positions']
  ])('should calculate distance between %i and %i as %i (%s)', (pos1, pos2, expected) => {
    expect(calculateDistance(pos1, pos2)).toBe(expected);
  });
});

describe(findClosestStory.name, () => {
  let stories: Story[];

  beforeEach(() => {
    stories = [
      createTestStory({ id: '1', position: -20 }),
      createTestStory({ id: '2', position: 0 }),
      createTestStory({ id: '3', position: 30 })
    ];
  });

  it('should return null for empty story list', () => {
    const result = findClosestStory([], 0);
    expect(result).toBeNull();
  });

  it('should find closest story to target position', () => {
    const result = findClosestStory(stories, 5);
    expect(result?.id).toBe('2'); // Story at position 0 is closest to 5
  });

  it('should handle exact matches', () => {
    const result = findClosestStory(stories, 30);
    expect(result?.id).toBe('3'); // Exact match
  });

  it('should handle edge cases', () => {
    const result = findClosestStory(stories, -100);
    expect(result?.id).toBe('1'); // Leftmost story
  });
});

describe(areStoriesOverlapping.name, () => {
  const story1 = createTestStory({ id: '1', position: 0 });

  it.each([
    [1, undefined, true, 'overlapping with default spacing'],
    [5, undefined, false, 'non-overlapping with default spacing'],
    [1, 0.5, false, 'non-overlapping with custom spacing'],
    [0, undefined, true, 'same position stories'],
    [2, undefined, false, 'exactly at default spacing threshold (not overlapping)'],
    [1.9, undefined, true, 'just under default spacing threshold']
  ])('should detect overlap between positions 0 and %i with spacing %s as %s (%s)',
    (position2, minSpacing, expected, description) => {
      const story2 = createTestStory({ id: '2', position: position2 });
      const result = areStoriesOverlapping(story1, story2, minSpacing);
      expect(result).toBe(expected);
    });
});

describe(snapToGrid.name, () => {
  it.each([
    [7, 5, 'snap down with default grid'],
    [8, 10, 'snap up with default grid'],
    [12, 10, 'snap down with default grid'],
    [13, 15, 'snap up with default grid'],
    [10, 10, 'exact grid position with default grid'],
    [-7, -5, 'negative snap up with default grid'],
    [-8, -10, 'negative snap down with default grid'],
    [-15, -15, 'exact negative grid position with default grid']
  ])('should snap %i to %i (%s)', (input, expected, description) => {
    expect(snapToGrid(input)).toBe(expected);
  });

  it.each([
    [7, 10, 10, 'snap up with custom grid'],
    [14, 10, 10, 'snap down with custom grid'],
    [16, 10, 20, 'snap up with custom grid']
  ])('should snap %i to %i with grid size %i (%s)', (input, gridSize, expected) => {
    expect(snapToGrid(input, gridSize)).toBe(expected);
  });

  it('should normalize result to valid range', () => {
    const result = snapToGrid(150, 5);
    expect(result).toBe(POSITION_MAX);
    expect(result).toBeLessThanOrEqual(POSITION_MAX);
  });
});