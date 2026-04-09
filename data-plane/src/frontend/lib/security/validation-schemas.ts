/**
 * Zod validation schemas for Server Actions
 * Never trust form data - always validate with Zod
 */

import { z } from "zod";

/**
 * User creation schema
 */
export const createUserSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(150, "Username must be 150 characters or less")
    .regex(/^[a-zA-Z0-9@.+\-_]+$/, "Username contains invalid characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(254, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  re_password: z
    .string()
    .min(8, "Password confirmation must be at least 8 characters")
    .max(128, "Password confirmation is too long"),
  first_name: z.string().max(150).optional(),
  last_name: z.string().max(150).optional(),
}).refine((data) => data.password === data.re_password, {
  message: "Passwords do not match",
  path: ["re_password"],
});

/**
 * Group creation/update schema
 */
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(150, "Group name must be 150 characters or less"),
  permissionIds: z
    .array(z.number().int().positive())
    .min(0, "Permission IDs must be an array"),
  permissionBundleIds: z
    .array(z.number().int().positive())
    .min(0, "Permission bundle IDs must be an array"),
});

/**
 * Permission bundle creation/update schema
 *
 * PermissionBundle (backend) constraints:
 * - name/code: max_length=100
 * - app: max_length=50, nullable
 * - description: TextField, nullable
 */
export const permissionBundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required").max(100, "Bundle name is too long"),
  code: z
    .string()
    .min(1, "Bundle code is required")
    .max(100, "Bundle code is too long")
    .regex(/^[a-z0-9_\\-]+$/i, "Bundle code contains invalid characters"),
  app: z
    .string()
    .max(50, "App label is too long")
    .optional()
    .nullable(),
  description: z
    .string()
    .max(5000, "Description is too long")
    .optional()
    .nullable(),
  permissionIds: z.array(z.number().int().positive()).min(0, "Permission IDs must be an array"),
});

/**
 * Asset creation schema (basic validation)
 */
export const assetCreateSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(255),
  category: z.number().int().positive("Category is required"),
  // Add more fields as needed
}).passthrough(); // Allow additional fields that backend validates

/**
 * Asset update schema (all fields optional)
 */
export const assetUpdateSchema = z.object({
  name: z.string().max(255).optional(),
  category: z.number().int().positive().optional(),
  // Add more fields as needed
}).passthrough(); // Allow additional fields that backend validates

/**
 * ID validation schema
 */
export const idSchema = z.number().int().positive("Invalid ID");

/**
 * Array of IDs validation schema
 */
export const idArraySchema = z.array(z.number().int().positive()).min(0);

/**
 * Parse FormData and validate with schema
 */
export function parseFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; errors?: z.ZodError } {
  try {
    // Convert FormData to object
    const data: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      // Handle multiple values for the same key
      if (data[key]) {
        if (Array.isArray(data[key])) {
          (data[key] as unknown[]).push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      // Format validation errors
      const errorMessages = result.error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        success: false,
        error: errorMessages.join(", "),
        errors: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Validate data object with schema
 */
export function validateData<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; errors?: z.ZodError } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        success: false,
        error: errorMessages.join(", "),
        errors: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}
