/**
 * Zod-based validation utilities with proper error handling
 */

import { ZodError } from 'zod';
import type { 
  Story, 
  CreateStoryInput, 
  UpdateStoryInput, 
  ValidationResult, 
  ValidationError,
  PlanningSession 
} from '../types';
import {
  StorySchema,
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  PlanningSessionSchema,
  PointCutoffSchema
} from '../types';

/**
 * Converts Zod errors to our ValidationError format
 */
function zodErrorToValidationErrors(error: ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message
  }));
}

/**
 * Validates create story input using Zod schema
 */
export function validateCreateStoryInput(input: CreateStoryInput): ValidationResult {
  try {
    CreateStoryInputSchema.parse(input);
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: zodErrorToValidationErrors(error)
      };
    }
    throw error;
  }
}

/**
 * Validates update story input using Zod schema
 */
export function validateUpdateStoryInput(input: UpdateStoryInput): ValidationResult {
  try {
    UpdateStoryInputSchema.parse(input);
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: zodErrorToValidationErrors(error)
      };
    }
    throw error;
  }
}

/**
 * Validates a complete story object using Zod schema
 */
export function validateStory(story: Story): ValidationResult {
  try {
    StorySchema.parse(story);
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: zodErrorToValidationErrors(error)
      };
    }
    throw error;
  }
}

/**
 * Validates point value using Zod schema
 */
export function validatePointValue(pointValue: number): ValidationResult {
  try {
    PointCutoffSchema.shape.pointValue.parse(pointValue);
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: zodErrorToValidationErrors(error)
      };
    }
    throw error;
  }
}

/**
 * Validates story uniqueness within a session
 */
export function validateStoryUniqueness(stories: Story[], newStory: CreateStoryInput): ValidationResult {
  const errors: ValidationError[] = [];

  const duplicateTitle = stories.find(story => 
    story.title.toLowerCase().trim() === newStory.title.toLowerCase().trim()
  );

  if (duplicateTitle) {
    errors.push({
      field: 'title',
      message: 'A story with this title already exists in the session'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive session validation using Zod schema
 */
export function validatePlanningSession(session: PlanningSession): ValidationResult {
  try {
    PlanningSessionSchema.parse(session);
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: zodErrorToValidationErrors(error)
      };
    }
    throw error;
  }
}

/**
 * Safe parsing functions that return parsed data or validation errors
 */
export function parseCreateStoryInput(input: unknown) {
  return CreateStoryInputSchema.safeParse(input);
}

export function parseUpdateStoryInput(input: unknown) {
  return UpdateStoryInputSchema.safeParse(input);
}

export function parseStory(input: unknown) {
  return StorySchema.safeParse(input);
}

export function parsePlanningSession(input: unknown) {
  return PlanningSessionSchema.safeParse(input);
}