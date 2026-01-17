/**
 * Input validation and sanitization utilities
 * Prevents command injection and other security vulnerabilities
 */

/**
 * Dangerous characters and patterns that could be used for command injection
 */
const DANGEROUS_PATTERNS = [
  /[;&|`$(){}[\]]/g, // Shell metacharacters
  /<script/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers
  /eval\s*\(/gi, // eval()
  /exec\s*\(/gi, // exec()
  /spawn\s*\(/gi, // spawn()
  /child_process/gi, // child_process
  /require\s*\(/gi, // require() in dangerous contexts
  /process\./gi, // process object access
  /\$\{/g, // Template literal injection
  /`/g, // Backticks (command substitution)
  /\$\{/g, // Template literal injection
];

/**
 * Sanitize a string to prevent command injection
 * Removes dangerous characters and patterns
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate and sanitize a string input
 * Returns null if input is invalid
 */
export function validateString(
  input: unknown,
  options: {
    maxLength?: number;
    minLength?: number;
    allowEmpty?: boolean;
    pattern?: RegExp;
  } = {}
): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const {
    maxLength = 10000,
    minLength = 0,
    allowEmpty = false,
    pattern,
  } = options;

  const sanitized = sanitizeString(input);

  if (!allowEmpty && sanitized.length === 0) {
    return null;
  }

  if (sanitized.length < minLength) {
    return null;
  }

  if (sanitized.length > maxLength) {
    return null;
  }

  if (pattern && !pattern.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validate an email address
 */
export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeString(email.toLowerCase());

  if (!sanitized || !emailPattern.test(sanitized)) {
    return null;
  }

  // Additional length check
  if (sanitized.length > 254) {
    return null;
  }

  return sanitized;
}

/**
 * Validate a numeric ID
 */
export function validateId(id: unknown): number | null {
  if (typeof id === 'number' && Number.isInteger(id) && id > 0) {
    return id;
  }

  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed.toString() === id.trim()) {
      return parsed;
    }
  }

  return null;
}

/**
 * Validate an array of IDs
 */
export function validateIdArray(ids: unknown): number[] | null {
  if (!Array.isArray(ids)) {
    return null;
  }

  const validatedIds: number[] = [];
  for (const id of ids) {
    const validatedId = validateId(id);
    if (validatedId === null) {
      return null;
    }
    validatedIds.push(validatedId);
  }

  return validatedIds;
}

/**
 * Sanitize a filename to prevent path traversal and command injection
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[/\\]/g, '_');

  // Remove dangerous characters
  sanitized = sanitizeString(sanitized);

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized || 'file';
}

/**
 * Validate FormData input
 */
export function validateFormDataField(
  formData: FormData,
  fieldName: string,
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
  } = {}
): string | null {
  const value = formData.get(fieldName);
  
  if (value === null) {
    return options.required ? null : '';
  }

  if (typeof value !== 'string') {
    return null;
  }

  return validateString(value, {
    maxLength: options.maxLength,
    minLength: options.minLength,
    pattern: options.pattern,
    allowEmpty: !options.required,
  });
}
