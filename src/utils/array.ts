/**
 * Utility functions for arrays
 */

/**
 * Returns a random item from an array
 * @param array - The array to get a random item from
 * @returns A random item from the array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}
