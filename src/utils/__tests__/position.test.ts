/**
 * Unit tests for position calculation utilities
 */

import { describe, it, expect } from 'vitest'
import { POSITION_MIN, POSITION_MAX } from '../../types'
import { createTestStory } from '../../test/utils'
import {
  normalizePosition,
  calculateDistance,
  areStoriesOverlapping,
} from '../position'

describe(normalizePosition.name, () => {
  it.each([
    [0, 0, 'zero position'],
    [50, 50, 'positive position within range'],
    [-50, -50, 'negative position within range'],
    [POSITION_MIN, POSITION_MIN, 'minimum boundary'],
    [POSITION_MAX, POSITION_MAX, 'maximum boundary'],
  ])('should return %i as %i for %s', (input, expected) => {
    expect(normalizePosition(input)).toBe(expected)
  })

  it.each([
    [-150, POSITION_MIN, 'far below minimum'],
    [-101, POSITION_MIN, 'just below minimum'],
  ])('should clamp %i to minimum value %i (%s)', (input, expected) => {
    expect(normalizePosition(input)).toBe(expected)
  })

  it.each([
    [150, POSITION_MAX, 'far above maximum'],
    [101, POSITION_MAX, 'just above maximum'],
  ])('should clamp %i to maximum value %i (%s)', (input, expected) => {
    expect(normalizePosition(input)).toBe(expected)
  })
})

describe(calculateDistance.name, () => {
  it.each([
    [0, 10, 10, 'positive positions'],
    [10, 0, 10, 'reversed positive positions'],
    [-10, 10, 20, 'negative to positive'],
    [10, -10, 20, 'positive to negative'],
    [5, 5, 0, 'same positions'],
    [-5, -5, 0, 'same negative positions'],
  ])(
    'should calculate distance between %i and %i as %i (%s)',
    (pos1, pos2, expected) => {
      expect(calculateDistance(pos1, pos2)).toBe(expected)
    }
  )
})

describe(areStoriesOverlapping.name, () => {
  const story1 = createTestStory({ id: '1', position: { x: 0, y: 0 } })

  it.each([
    [1, undefined, true, 'overlapping with default spacing'],
    [5, undefined, false, 'non-overlapping with default spacing'],
    [1, 0.5, false, 'non-overlapping with custom spacing'],
    [0, undefined, true, 'same position stories'],
    [
      2,
      undefined,
      false,
      'exactly at default spacing threshold (not overlapping)',
    ],
    [1.9, undefined, true, 'just under default spacing threshold'],
  ])(
    'should detect overlap between positions 0 and %i with spacing %s as %s (%s)',
    (position2, minSpacing, expected, description) => {
      const story2 = createTestStory({
        id: '2',
        position: { x: position2, y: 0 },
      })
      const result = areStoriesOverlapping(story1, story2, minSpacing)
      expect(result).toBe(expected)
    }
  )
})
