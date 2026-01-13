/**
 * File validation utilities
 * Prevents dangerous file uploads, path traversal, and command injection
 */

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  blockedExtensions?: string[];
  allowedMimeTypes?: string[];
  blockedMimeTypes?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Default dangerous file extensions that should be blocked
 */
export const DEFAULT_DANGEROUS_EXTENSIONS = [
  '.sh',
  '.bat',
  '.cmd',
  '.exe',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.ps1',
  '.com',
  '.pif',
  '.vbe',
  '.wsf',
  '.cpl',
  '.msi',
  '.dll',
];

/**
 * Default allowed image MIME types
 */
export const DEFAULT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * Validate a filename to prevent path traversal and command injection
 */
export function validateFilename(filename: string): FileValidationResult {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Invalid filename' };
  }

  // Dangerous characters that could be used for path traversal or command injection
  const dangerousChars = ['..', '/', '\\', ';', '|', '&', '`', '$', '(', ')', '{', '}', '[', ']', '<', '>', '\0'];

  for (const char of dangerousChars) {
    if (filename.includes(char)) {
      return { valid: false, error: `Invalid filename: contains dangerous character` };
    }
  }

  // Check for empty or only whitespace
  if (filename.trim().length === 0) {
    return { valid: false, error: 'Filename cannot be empty' };
  }

  // Check length (filesystem limits)
  if (filename.length > 255) {
    return { valid: false, error: 'Filename too long (max 255 characters)' };
  }

  return { valid: true };
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  filename: string,
  options: { allowedExtensions?: string[]; blockedExtensions?: string[] } = {}
): FileValidationResult {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Invalid filename' };
  }

  const fileName = filename.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));

  // Check blocked extensions (default dangerous extensions)
  const blocked = options.blockedExtensions || DEFAULT_DANGEROUS_EXTENSIONS;
  if (blocked.some(ext => fileName.endsWith(ext.toLowerCase()))) {
    return { valid: false, error: `File has a dangerous file extension and cannot be uploaded` };
  }

  // Check allowed extensions (if specified)
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    const allowed = options.allowedExtensions.map(ext => ext.toLowerCase());
    if (!allowed.includes(extension.toLowerCase())) {
      return { valid: false, error: `File extension not allowed. Allowed extensions: ${allowed.join(', ')}` };
    }
  }

  return { valid: true };
}

/**
 * Validate file MIME type
 */
export function validateFileMimeType(
  file: File,
  options: { allowedMimeTypes?: string[]; blockedMimeTypes?: string[] } = {}
): FileValidationResult {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }

  const mimeType = file.type.toLowerCase();

  // Check blocked MIME types
  if (options.blockedMimeTypes && options.blockedMimeTypes.length > 0) {
    const blocked = options.blockedMimeTypes.map(type => type.toLowerCase());
    if (blocked.includes(mimeType)) {
      return { valid: false, error: `File type not allowed` };
    }
  }

  // Check allowed MIME types (if specified)
  if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    const allowed = options.allowedMimeTypes.map(type => type.toLowerCase());
    if (!allowed.includes(mimeType)) {
      return { valid: false, error: `File type not allowed. Allowed types: ${allowed.join(', ')}` };
    }
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeBytes: number): FileValidationResult {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    return { valid: false, error: `File exceeds maximum size of ${maxSizeMB}MB` };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation
 * Validates filename, extension, MIME type, and size
 */
export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  // Validate file object
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }

  // Validate filename
  const filenameValidation = validateFilename(file.name);
  if (!filenameValidation.valid) {
    return { valid: false, error: filenameValidation.error || 'Invalid filename' };
  }

  // Validate file extension
  const extensionValidation = validateFileExtension(file.name, {
    allowedExtensions: options.allowedExtensions,
    blockedExtensions: options.blockedExtensions,
  });
  if (!extensionValidation.valid) {
    return { valid: false, error: extensionValidation.error || 'Invalid file extension' };
  }

  // Validate MIME type
  const mimeTypeValidation = validateFileMimeType(file, {
    allowedMimeTypes: options.allowedMimeTypes,
    blockedMimeTypes: options.blockedMimeTypes,
  });
  if (!mimeTypeValidation.valid) {
    return { valid: false, error: mimeTypeValidation.error || 'Invalid file type' };
  }

  // Validate file size
  if (options.maxSizeBytes !== undefined) {
    const sizeValidation = validateFileSize(file, options.maxSizeBytes);
    if (!sizeValidation.valid) {
      return { valid: false, error: sizeValidation.error || 'File too large' };
    }
  }

  return { valid: true };
}

/**
 * Validate multiple files
 * Returns the first error found, or success if all files are valid
 */
export function validateFiles(files: File[], options: FileValidationOptions = {}): FileValidationResult {
  if (!files || files.length === 0) {
    return { valid: true };
  }

  for (const file of files) {
    const validation = validateFile(file, options);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error ? `${file.name}: ${validation.error}` : `Invalid file: ${file.name}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Pre-configured validation for image uploads
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): FileValidationResult {
  return validateFile(file, {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    allowedMimeTypes: DEFAULT_IMAGE_MIME_TYPES,
    blockedExtensions: DEFAULT_DANGEROUS_EXTENSIONS,
  });
}

/**
 * Pre-configured validation for general file attachments
 */
export function validateAttachmentFile(file: File, maxSizeMB: number = 50): FileValidationResult {
  return validateFile(file, {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    blockedExtensions: DEFAULT_DANGEROUS_EXTENSIONS,
  });
}
