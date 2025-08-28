/**
 * Unit tests for position calculation utilities
 */

import { describe, it, expect } from 'vitest'
import {
  normalizePosition2D,
  positionToPercentage,
  calculatePositionScore,
  adjustStoriesRelativeToNewAnchor,
  ANCHOR_POSITION,
} from '../position'
import type { Story } from '../../types'

describe('Position utilities', () => {
  describe('normalizePosition2D', () => {
    it('should normalize position within bounds', () => {
      expect(normalizePosition2D({ x: 150, y: -150 })).toEqual({
        x: 100,
        y: -100,
      })
      expect(normalizePosition2D({ x: -50, y: 50 })).toEqual({ x: -50, y: 50 })
    })
  })

  describe('positionToPercentage', () => {
    it('should convert position to percentage', () => {
      const result = positionToPercentage({ x: 0, y: 0 })
      expect(result.left).toBe('50%')
      expect(result.top).toBe('50%')
    })
  })

  describe('calculatePositionScore', () => {
    it('should calculate position score', () => {
      const score = calculatePositionScore({ x: 0, y: 0 })
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(10)
    })
  })

  describe('adjustStoriesRelativeToNewAnchor', () => {
    it('should adjust story positions relative to new anchor', () => {
      const stories: Story[] = [
        {
          id: 'anchor',
          title: 'Old Anchor',
          description: '',
          position: { x: 10, y: 20 },
          isAnchor: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'story1',
          title: 'Story 1',
          description: '',
          position: { x: 30, y: 40 },
          isAnchor: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'story2',
          title: 'Story 2',
          description: '',
          position: { x: 50, y: 60 },
          isAnchor: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const result = adjustStoriesRelativeToNewAnchor(stories, 'story1')

      // New anchor should be at anchor position
      const newAnchor = result.find(s => s.id === 'story1')
      expect(newAnchor?.position).toEqual(ANCHOR_POSITION)
      expect(newAnchor?.isAnchor).toBe(true)

      // Other stories should maintain relative positions
      const oldAnchor = result.find(s => s.id === 'anchor')
      expect(oldAnchor?.position).toEqual({ x: 0, y: 0 }) // Old anchor relative to itself is (0,0)

      const story2 = result.find(s => s.id === 'story2')
      expect(story2?.position).toEqual({ x: 40, y: 40 }) // 50-10, 60-20 (relative to old anchor)
    })

    it('should handle case with no previous anchor', () => {
      const stories: Story[] = [
        {
          id: 'story1',
          title: 'Story 1',
          description: '',
          position: { x: 10, y: 20 },
          isAnchor: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'story2',
          title: 'Story 2',
          description: '',
          position: { x: 30, y: 40 },
          isAnchor: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const result = adjustStoriesRelativeToNewAnchor(stories, 'story1')

      // New anchor should be at anchor position
      const newAnchor = result.find(s => s.id === 'story1')
      expect(newAnchor?.position).toEqual(ANCHOR_POSITION)
      expect(newAnchor?.isAnchor).toBe(true)

      // Other stories should keep their original positions
      const story2 = result.find(s => s.id === 'story2')
      expect(story2?.position).toEqual({ x: 30, y: 40 })
    })

    it('should handle custom anchor position', () => {
      const stories: Story[] = [
        {
          id: 'anchor',
          title: 'Old Anchor',
          description: '',
          position: { x: 10, y: 20 },
          isAnchor: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'story1',
          title: 'Story 1',
          description: '',
          position: { x: 30, y: 40 },
          isAnchor: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const customAnchorPos = { x: 50, y: 60 }
      const result = adjustStoriesRelativeToNewAnchor(
        stories,
        'story1',
        customAnchorPos
      )

      // New anchor should be at custom position
      const newAnchor = result.find(s => s.id === 'story1')
      expect(newAnchor?.position).toEqual(customAnchorPos)
      expect(newAnchor?.isAnchor).toBe(true)

      // Old anchor should maintain relative position from new anchor
      const oldAnchor = result.find(s => s.id === 'anchor')
      expect(oldAnchor?.position).toEqual({ x: 50, y: 60 }) // Old anchor relative to itself is (0,0), so it's at the new anchor position
    })
  })
})
