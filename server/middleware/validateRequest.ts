/**
 * Request validation middleware
 * Provides reusable validation functions for request data
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Field validator interface
 */
interface FieldValidator {
  field: string;
  validators: Array<(value: any) => string | null>;
}

/**
 * Validate required fields are present
 */
export function validateRequired(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(
      (field) => {
        const value = req.body?.[field];
        return value === undefined || value === null || value === '';
      }
    );

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields }
      );
    }

    next();
  };
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password validation
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Get password validation errors
 */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
}

/**
 * Username validation
 * Requirements: 3-20 characters, alphanumeric and underscores only
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate email field
 */
export function validateEmail() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format', {
        field: 'email',
        value: email,
      });
    }

    next();
  };
}

/**
 * Validate password field
 */
export function validatePassword() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { password } = req.body;

    if (!password) {
      throw new ValidationError('Password is required');
    }

    const errors = getPasswordErrors(password);
    if (errors.length > 0) {
      throw new ValidationError('Password does not meet requirements', {
        field: 'password',
        requirements: errors,
      });
    }

    next();
  };
}

/**
 * Validate username field
 */
export function validateUsername() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { username } = req.body;

    if (!username) {
      throw new ValidationError('Username is required');
    }

    if (!isValidUsername(username)) {
      throw new ValidationError(
        'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        {
          field: 'username',
          value: username,
        }
      );
    }

    next();
  };
}

/**
 * Validate registration request
 */
export function validateRegistration() {
  return [
    validateRequired(['email', 'password', 'username']),
    validateEmail(),
    validatePassword(),
    validateUsername(),
  ];
}

/**
 * Validate login request
 */
export function validateLogin() {
  return [
    validateRequired(['email', 'password']),
    validateEmail(),
  ];
}

/**
 * Validate change password request
 */
export function validateChangePassword() {
  return [
    validateRequired(['currentPassword', 'newPassword']),
    (req: Request, res: Response, next: NextFunction): void => {
      const { newPassword } = req.body;
      const errors = getPasswordErrors(newPassword);

      if (errors.length > 0) {
        throw new ValidationError('New password does not meet requirements', {
          field: 'newPassword',
          requirements: errors,
        });
      }

      next();
    },
  ];
}

/**
 * Validate profile update request
 */
export function validateProfileUpdate() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { username, email } = req.body;

    // At least one field must be provided
    if (!username && !email) {
      throw new ValidationError('At least one field (username or email) must be provided');
    }

    // Validate username if provided
    if (username && !isValidUsername(username)) {
      throw new ValidationError(
        'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        {
          field: 'username',
          value: username,
        }
      );
    }

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      throw new ValidationError('Invalid email format', {
        field: 'email',
        value: email,
      });
    }

    next();
  };
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate ID parameter
 */
export function validateIdParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id) {
      throw new ValidationError(`Missing ${paramName} parameter`);
    }

    if (!isValidUUID(id)) {
      throw new ValidationError(`Invalid ${paramName} format`, {
        field: paramName,
        value: id,
      });
    }

    next();
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate request body size
 */
export function validateBodySize(maxSizeBytes: number = 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new ValidationError('Request body too large', {
        maxSize: maxSizeBytes,
        receivedSize: parseInt(contentLength),
      });
    }

    next();
  };
}

/**
 * Custom field validation
 */
export function validateFields(validators: FieldValidator[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    for (const { field, validators: fieldValidators } of validators) {
      const value = req.body[field];

      for (const validator of fieldValidators) {
        const error = validator(value);
        if (error) {
          errors.push({ field, message: error });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', { errors });
    }

    next();
  };
}

export default {
  validateRequired,
  validateEmail,
  validatePassword,
  validateUsername,
  validateRegistration,
  validateLogin,
  validateChangePassword,
  validateProfileUpdate,
  validateIdParam,
  validateBodySize,
  validateFields,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidUUID,
  sanitizeString,
  getPasswordErrors,
};
