/**
 * Color utilities for position-based visual indicators
 */

import { POSITION_MIN, POSITION_MAX, Position2D } from '@/types'

/**
 * Normalize a value to a 0-1 range
 * @param value - The value to normalize
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The normalized value
 */
function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min)
}
/**
 * Get a CSS class for the position color (for use with Tailwind)
 * @param x - X position (-100 to 100)
 * @param y - Y position (-100 to 100)
 * @returns Tailwind color class
 */
export function getPositionColorClass(position: Position2D): string {
  const sum = position.x + -position.y

  const normalizedSum = normalize(
    sum,
    POSITION_MIN + POSITION_MIN,
    POSITION_MAX + POSITION_MAX
  )

  console.log({ sum, normalizedSum })
  // Map to Tailwind color classes
  if (normalizedSum > 0.8) return 'bg-red-500'
  if (normalizedSum > 0.6) return 'bg-amber-500'
  if (normalizedSum > 0.5) return 'bg-yellow-500'
  if (normalizedSum > 0.4) return 'bg-neutral-500'
  if (normalizedSum > 0.3) return 'bg-lime-500'
  if (normalizedSum > 0.2) return 'bg-green-500'
  return 'bg-emerald-500'
}
