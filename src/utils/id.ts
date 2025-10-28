/**
 * ID generation utilities
 */

import { SESSION_CODE_LENGTH } from '@/types'

/**
 * Generates a unique ID using crypto.randomUUID if available,
 * falls back to a timestamp-based approach
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generates a short, human-readable ID for session sharing
 * Uses uppercase letters and numbers, avoiding confusing characters
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excludes I, O, 0, 1
  let result = ''

  for (let i = 0; i < SESSION_CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

/**
 * Converts a session ID (XXXXXX) to a readable format (XXX-XXX)
 * @param sessionId - The session ID to convert to readable format
 * @returns The readable format of the session ID
 */
export function sessionIdToReadableFormat(sessionId: string): string {
  return (
    sessionId.toUpperCase().slice(0, 3) +
    '-' +
    sessionId.toUpperCase().slice(3, 6)
  )
}
