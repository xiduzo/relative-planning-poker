/**
 * Unit tests for position calculation utilities
 */

import { describe, it, expect } from 'vitest'
import {
  normalizePosition2D,
  positionToPercentage,
  calculatePositionScore,
  calculateStoryPoints,
} from '../position'
import type { Story } from '@/types'

describe('Position utilities', () => {
  describe('normalizePosition2D', () => {
    it('should normalize position within valid range', () => {
      const result = normalizePosition2D({ x: 150, y: -200 })
      expect(result.x).toBe(100)
      expect(result.y).toBe(-100)
    })

    it('should keep valid positions unchanged', () => {
      const position = { x: 50, y: -30 }
      const result = normalizePosition2D(position)
      expect(result).toEqual(position)
    })
  })

  describe('positionToPercentage', () => {
    it('should convert position to percentage', () => {
      const result = positionToPercentage({ x: 0, y: 0 })
      expect(result.left).toBe('50%')
      expect(result.top).toBe('50%')
    })

    it('should handle edge cases', () => {
      const result = positionToPercentage({ x: -100, y: 100 })
      expect(result.left).toBe('0%')
      expect(result.top).toBe('100%')
    })
  })

  describe('calculatePositionScore', () => {
    it('should calculate score for center position', () => {
      const score = calculatePositionScore({ x: 0, y: 0 })
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(10)
    })

    it('should calculate score for edge position', () => {
      const score = calculatePositionScore({ x: 100, y: 100 })
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('calculateStoryPoints', () => {
    const anchorStory: Story = {
      id: 'anchor',
      title: 'Anchor Story',
      description: 'Anchor story description',
      position: { x: 0, y: 0 },
      isAnchor: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should return anchor story points for anchor story', () => {
      const result = calculateStoryPoints(anchorStory, 8)
      expect(result).toBe(8)
    })

    it('should calculate story points for nearby story', () => {
      const nearbyStory: Story = {
        id: 'nearby',
        title: 'Nearby Story',
        description: 'Nearby story description',
        position: { x: 10, y: 10 }, // Close to anchor
        isAnchor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = calculateStoryPoints(nearbyStory, 8)
      expect(result).toBeGreaterThan(0)
      expect([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]).toContain(result)
    })

    it('should calculate story points for distant story', () => {
      const distantStory: Story = {
        id: 'distant',
        title: 'Distant Story',
        description: 'Distant story description',
        position: { x: 80, y: 80 }, // Far from anchor
        isAnchor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = calculateStoryPoints(distantStory, 8)
      expect(result).toBeGreaterThan(0)
      expect([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]).toContain(result)

      // Distant stories (high complexity) should get higher story points
      // than nearby stories (low complexity) due to the weighted scoring system
      const nearbyResult = calculateStoryPoints(
        { ...distantStory, position: { x: 10, y: 10 } },
        8
      )
      expect(result).toBeGreaterThanOrEqual(nearbyResult!)
    })

    it('should handle edge case positions', () => {
      const edgeStory: Story = {
        id: 'edge',
        title: 'Edge Story',
        description: 'Edge story description',
        position: { x: 100, y: 100 }, // Maximum distance
        isAnchor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = calculateStoryPoints(edgeStory, 8)
      expect(result).toBeGreaterThan(0)
      expect([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]).toContain(result)
    })

    it('should map positions correctly: bottom-left = lowest, top-right = highest', () => {
      const anchorStoryPoints = 8

      // Bottom-left story (low complexity, low uncertainty)
      const bottomLeftStory: Story = {
        id: 'bottom-left',
        title: 'Bottom Left Story',
        description: 'Low complexity, low uncertainty',
        position: { x: -80, y: -80 }, // Bottom-left area
        isAnchor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Top-right story (high complexity, high uncertainty)
      const topRightStory: Story = {
        id: 'top-right',
        title: 'Top Right Story',
        description: 'High complexity, high uncertainty',
        position: { x: 80, y: 80 }, // Top-right area
        isAnchor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const bottomLeftPoints = calculateStoryPoints(
        bottomLeftStory,
        anchorStoryPoints
      )
      const topRightPoints = calculateStoryPoints(
        topRightStory,
        anchorStoryPoints
      )

      // Both should be valid Fibonacci numbers
      expect([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]).toContain(bottomLeftPoints)
      expect([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]).toContain(topRightPoints)

      // Bottom-left should have lower story points than top-right
      expect(bottomLeftPoints).toBeLessThan(topRightPoints!)
    })
  })
})
