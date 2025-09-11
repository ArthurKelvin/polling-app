/**
 * Form utility functions for better user experience and validation
 * 
 * This module provides utilities for form handling, validation feedback,
 * and user experience improvements across the polling application.
 */

import { ValidationError } from './errors';

/**
 * Form validation result interface
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  suggestions: Record<string, string>;
}

/**
 * Enhanced form validation with detailed feedback
 * 
 * @param data - Form data to validate
 * @param schema - Zod schema for validation
 * @returns Detailed validation result with errors, warnings, and suggestions
 */
export function validateFormData<T>(
  data: T,
  schema: any
): FormValidationResult {
  const result: FormValidationResult = {
    isValid: true,
    errors: {},
    warnings: {},
    suggestions: {}
  };

  try {
    schema.parse(data);
  } catch (error: any) {
    result.isValid = false;
    
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const field = err.path.join('.');
        result.errors[field] = err.message;
        
        // Add suggestions based on error type
        if (err.code === 'too_small') {
          result.suggestions[field] = 'Try adding more content to make it more descriptive';
        } else if (err.code === 'too_big') {
          result.suggestions[field] = 'Try shortening the content to fit the limit';
        } else if (err.code === 'invalid_string') {
          result.suggestions[field] = 'Check for special characters or formatting issues';
        }
      });
    }
  }

  return result;
}

/**
 * Generate user-friendly error messages for form fields
 * 
 * @param field - Field name
 * @param error - Error message
 * @returns User-friendly error message
 */
export function getFieldErrorMessage(field: string, error: string): string {
  const fieldDisplayName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
  
  const errorMessages: Record<string, string> = {
    'required': `${fieldDisplayName} is required`,
    'too_small': `${fieldDisplayName} is too short`,
    'too_big': `${fieldDisplayName} is too long`,
    'invalid_string': `${fieldDisplayName} contains invalid characters`,
    'invalid_email': 'Please enter a valid email address',
    'invalid_url': 'Please enter a valid URL',
    'invalid_uuid': 'Invalid identifier format'
  };

  return errorMessages[error] || error;
}

/**
 * Format form data for display in error messages
 * 
 * @param formData - Form data object
 * @returns Formatted string for display
 */
export function formatFormDataForDisplay(formData: Record<string, any>): string {
  const entries = Object.entries(formData)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  return entries || 'No data provided';
}

/**
 * Sanitize form input to prevent XSS attacks
 * 
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeFormInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocols
}

/**
 * Validate poll question with enhanced feedback
 * 
 * @param question - Poll question to validate
 * @returns Validation result with detailed feedback
 */
export function validatePollQuestion(question: string): FormValidationResult {
  const result: FormValidationResult = {
    isValid: true,
    errors: {},
    warnings: {},
    suggestions: {}
  };

  if (!question || question.trim().length === 0) {
    result.isValid = false;
    result.errors.question = 'Poll question is required';
    return result;
  }

  if (question.trim().length < 3) {
    result.isValid = false;
    result.errors.question = 'Poll question must be at least 3 characters long';
    result.suggestions.question = 'Try adding more detail to make your question clearer';
  }

  if (question.length > 500) {
    result.isValid = false;
    result.errors.question = 'Poll question cannot exceed 500 characters';
    result.suggestions.question = 'Try shortening your question while keeping the main point';
  }

  if (!/^[a-zA-Z0-9\s\?\!\.\,\-\'\"\:\;\(\)]+$/.test(question)) {
    result.isValid = false;
    result.errors.question = 'Question contains invalid characters';
    result.suggestions.question = 'Use only letters, numbers, spaces, and basic punctuation';
  }

  // Add warnings for potential issues
  if (question.length > 200) {
    result.warnings.question = 'Long questions might reduce engagement';
  }

  if (!question.includes('?')) {
    result.warnings.question = 'Consider adding a question mark to make it clearer';
  }

  return result;
}

/**
 * Validate poll options with enhanced feedback
 * 
 * @param options - Array of poll options to validate
 * @returns Validation result with detailed feedback
 */
export function validatePollOptions(options: string[]): FormValidationResult {
  const result: FormValidationResult = {
    isValid: true,
    errors: {},
    warnings: {},
    suggestions: {}
  };

  if (!options || options.length === 0) {
    result.isValid = false;
    result.errors.options = 'At least one poll option is required';
    return result;
  }

  if (options.length < 2) {
    result.isValid = false;
    result.errors.options = 'At least 2 poll options are required';
    result.suggestions.options = 'Add more options to give voters meaningful choices';
  }

  if (options.length > 10) {
    result.isValid = false;
    result.errors.options = 'Maximum 10 poll options allowed';
    result.suggestions.options = 'Consider reducing options to avoid overwhelming voters';
  }

  // Validate each option
  options.forEach((option, index) => {
    const fieldName = `option${index + 1}`;
    
    if (!option || option.trim().length === 0) {
      result.isValid = false;
      result.errors[fieldName] = 'Poll option cannot be empty';
      return;
    }

    if (option.trim().length < 1) {
      result.isValid = false;
      result.errors[fieldName] = 'Poll option must contain at least one character';
    }

    if (option.length > 200) {
      result.isValid = false;
      result.errors[fieldName] = 'Poll option cannot exceed 200 characters';
      result.suggestions[fieldName] = 'Try shortening this option while keeping it clear';
    }

    if (!/^[a-zA-Z0-9\s\?\!\.\,\-\'\"\:\;\(\)]+$/.test(option)) {
      result.isValid = false;
      result.errors[fieldName] = 'Option contains invalid characters';
      result.suggestions[fieldName] = 'Use only letters, numbers, spaces, and basic punctuation';
    }
  });

  // Check for duplicate options
  const uniqueOptions = new Set(options.map(opt => opt.toLowerCase().trim()));
  if (uniqueOptions.size !== options.length) {
    result.warnings.options = 'Some options appear to be duplicates';
    result.suggestions.options = 'Make sure each option is unique and distinct';
  }

  return result;
}

/**
 * Generate form submission summary for logging
 * 
 * @param formData - Form data that was submitted
 * @param validationResult - Validation result
 * @returns Summary string for logging
 */
export function generateFormSubmissionSummary(
  formData: Record<string, any>,
  validationResult: FormValidationResult
): string {
  const summary = {
    timestamp: new Date().toISOString(),
    isValid: validationResult.isValid,
    errorCount: Object.keys(validationResult.errors).length,
    warningCount: Object.keys(validationResult.warnings).length,
    fieldCount: Object.keys(formData).length,
    hasErrors: !validationResult.isValid
  };

  return `Form submission: ${JSON.stringify(summary)}`;
}
