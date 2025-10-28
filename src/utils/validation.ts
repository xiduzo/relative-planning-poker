/**
 * Zod-based validation utilities with proper error handling
 */

import { ZodError } from 'zod'

/**
 * Converts an error to a human-readable message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    console.warn('ZodError', error)
    return error.issues.map(issue => issue.message).join(', ')
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}
