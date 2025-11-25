/**
 * Validation utilities for asset form fields
 */

import { AssetFormData } from "@/types/assets"

// ==================== Validation Functions ====================
/**
 * Validates IPv4 address format
 */
export const isValidIPv4 = (ip: string): boolean => {
  if (!ip || ip.trim() === "") return true; // Empty is valid (optional field)
  
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split(".");
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validates IPv6 address format (simplified)
 */
export const isValidIPv6 = (ip: string): boolean => {
  if (!ip || ip.trim() === "") return true; // Empty is valid (optional field)
  
  // Simplified IPv6 validation - allows compressed format
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/;
  return ipv6Regex.test(ip);
}

/**
 * Validates IP address (IPv4 or IPv6)
 */
export const isValidIPAddress = (ip: string): boolean => {
  if (!ip || ip.trim() === "") return true; // Empty is valid (optional field)
  return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * Validates MAC address format (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)
 */
export const isValidMACAddress = (mac: string): boolean => {
  if (!mac || mac.trim() === "") return true; // Empty is valid (optional field)
  
  // Allow multiple MAC addresses separated by newlines or commas
  const macAddresses = mac.split(/[\n,]/).map((m) => m.trim()).filter(Boolean);
  
  if (macAddresses.length === 0) return true;
  
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macAddresses.every((addr) => macRegex.test(addr));
}

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === "") return true; // Empty is valid (optional field)
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export const isValidURL = (url: string): boolean => {
  if (!url || url.trim() === "") return true; // Empty is valid (optional field)
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export const isValidDate = (date: string): boolean => {
  if (!date || date.trim() === "") return true; // Empty is valid (optional field)
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validates numeric value
 */
export const isValidNumber = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined || value === "") return true; // Empty is valid (optional field)
  
  if (typeof value === "number") return !isNaN(value) && isFinite(value);
  
  const num = parseFloat(String(value));
  return !isNaN(num) && isFinite(num);
}

/**
 * Validates positive number
 */
export const isValidPositiveNumber = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined || value === "") return true; // Empty is valid (optional field)
  
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return !isNaN(num) && isFinite(num) && num >= 0;
}

/**
 * Validates that a string is not empty (for required fields)
 */
export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/**
 * Validates that a value is selected (for required selects)
 */
export const isSelected = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return value !== 0;
  if (typeof value === "object" && "id" in value) return value.id !== null && value.id !== undefined;
  return true;
}


/**
 * Validates a specific step and returns validation result with error messages
 */
export const validateStep = (
  stepIndex: number,
  formData: AssetFormData
): { isValid: boolean; error?: string; fieldErrors?: Record<string, string> } => {
  const fieldErrors: Record<string, string> = {}

  switch (stepIndex) {
    case 0: // Basic Details
      // Validate name
      if (!formData.name || (typeof formData.name === "string" && formData.name.trim() === "")) {
        fieldErrors.name = "Asset name is required"
      }
      
      // Validate category - could be string ID, number ID, or object
      if (!formData.category) {
        fieldErrors.category = "Asset type (category) is required"
      } else if (typeof formData.category === "string" && (formData.category as string).trim() === "") {
        fieldErrors.category = "Asset type (category) is required"
      } else if (typeof formData.category === "number" && formData.category === 0) {
        fieldErrors.category = "Asset type (category) is required"
      }
      
      if (Object.keys(fieldErrors).length > 0) {
        return { isValid: false, error: Object.values(fieldErrors)[0], fieldErrors }
      }
      return { isValid: true }

    case 1: // Tech Specs
      // Validate IP address if provided
      if (formData.ip_address && formData.ip_address.trim() !== "") {
        if (!isValidIPAddress(formData.ip_address)) {
          fieldErrors.ip_address = "Please enter a valid IP address (e.g., 192.168.1.1)"
        }
      }

      // Validate MAC address if provided
      if (formData.mac_address && formData.mac_address.trim() !== "") {
        if (!isValidMACAddress(formData.mac_address)) {
          fieldErrors.mac_address = "Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7)"
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        return { isValid: false, error: Object.values(fieldErrors)[0], fieldErrors }
      }
      return { isValid: true }

    case 2: // Location & Usage
      // Validate dates if provided 
      if (formData.in_current_state_since && typeof formData.in_current_state_since === "string" && formData.in_current_state_since.trim() !== "") {
        if (!isValidDate(formData.in_current_state_since)) {
          fieldErrors.in_current_state_since = "Please enter a valid date (YYYY-MM-DD)"
        }
      }

      if (formData.expected_checkin_date && typeof formData.expected_checkin_date === "string" && formData.expected_checkin_date.trim() !== "") {
        if (!isValidDate(formData.expected_checkin_date)) {
          fieldErrors.expected_checkin_date = "Please enter a valid date (YYYY-MM-DD)"
        }
      }

      // used_by is a number (user ID), no validation needed
      if (Object.keys(fieldErrors).length > 0) {
        return { isValid: false, error: Object.values(fieldErrors)[0], fieldErrors }
      }
      return { isValid: true }

    case 3: // Cost Depreciation
      // Validate numeric fields if provided
      if (formData.purchase_price && typeof formData.purchase_price === "string" && formData.purchase_price.trim() !== "") {
        const purchasePrice = parseFloat(formData.purchase_price.replace(/[^0-9.-]/g, ""))
        if (!isValidPositiveNumber(purchasePrice)) {
          fieldErrors.purchase_price = "Please enter a valid positive number"
        }
      }

      if (formData.replacement_cost && typeof formData.replacement_cost === "string" && formData.replacement_cost.trim() !== "") {
        const replacementCost = parseFloat(formData.replacement_cost.replace(/[^0-9.-]/g, ""))
        if (!isValidPositiveNumber(replacementCost)) {
          fieldErrors.replacement_cost = "Please enter a valid positive number"
        }
      }

      if (formData.salvage_value && typeof formData.salvage_value === "string" && formData.salvage_value.trim() !== "") {
        const salvageValue = parseFloat(formData.salvage_value.replace(/[^0-9.-]/g, ""))
        if (!isValidPositiveNumber(salvageValue)) {
          fieldErrors.salvage_value = "Please enter a valid positive number"
        }
      }

      if (formData.useful_life_years !== undefined && formData.useful_life_years !== null) {
        if (!isValidPositiveNumber(formData.useful_life_years)) {
          fieldErrors.useful_life_years = "Please enter a valid positive number"
        }
      }

      if (formData.approaching_eol_months !== undefined && formData.approaching_eol_months !== null) {
        if (!isValidPositiveNumber(formData.approaching_eol_months)) {
          fieldErrors.approaching_eol_months = "Please enter a valid positive number"
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        return { isValid: false, error: Object.values(fieldErrors)[0], fieldErrors }
      }
      return { isValid: true }

    case 4: // Warranty & Acquisition
      // Validate dates if provided
      if (formData.acquisition_date && formData.acquisition_date.trim() !== "") {
        if (!isValidDate(formData.acquisition_date)) {
          fieldErrors.acquisition_date = "Please enter a valid date (YYYY-MM-DD)"
        }
      }

      if (formData.warranty_expiration && formData.warranty_expiration.trim() !== "") {
        if (!isValidDate(formData.warranty_expiration)) {
          fieldErrors.warranty_expiration = "Please enter a valid date (YYYY-MM-DD)"
        }
      }

      if (formData.installation_date && formData.installation_date.trim() !== "") {
        if (!isValidDate(formData.installation_date)) {
          fieldErrors.installation_date = "Please enter a valid date (YYYY-MM-DD)"
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        return { isValid: false, error: Object.values(fieldErrors)[0], fieldErrors }
      }
      return { isValid: true }

    case 5: // Alerts
      // All fields optional, no validation needed
      return { isValid: true }

    case 6: // Additional Details
      // All fields optional, no validation needed
      return { isValid: true }

    default:
      return { isValid: true }
  }
}

/**
 * Legacy const for backward compatibility
 * @deprecated Use validateStep instead
 */
export const isStepValid = (stepIndex: number, formData: AssetFormData): boolean => {
  return validateStep(stepIndex, formData).isValid
}