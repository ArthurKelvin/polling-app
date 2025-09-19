/**
 * Form utility functions for better user experience and validation
 * 
 * This module provides utilities for form handling, validation feedback,
 * and user experience improvements across the polling application.
 */

// ValidationError import removed - not used in this file

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

// Note: Poll validation functions moved to validation.ts to avoid duplication

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
