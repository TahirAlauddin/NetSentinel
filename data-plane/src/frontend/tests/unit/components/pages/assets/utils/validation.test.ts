/**
 * Unit tests for components/pages/assets/utils/validation.ts
 */

import {
  isValidIPv4,
  isValidIPv6,
  isValidIPAddress,
  isValidMACAddress,
  isValidEmail,
  isValidURL,
  isValidDate,
  isValidNumber,
  isValidPositiveNumber,
  isNotEmpty,
  isSelected,
  validateStepForCreate,
  validateStepForUpdate,
} from "@/components/pages/assets/utils/validation";
import { mockAssetCategory } from "@/tests/__fixtures__/api-responses";
import { AssetCreateDto, AssetUpdateDto } from "@/types/assets/dto";

describe('Asset Validation Utils', () => {
  describe('isValidIPv4', () => {
    it('should return true for valid IPv4 addresses', () => {
      expect(isValidIPv4("192.168.1.1")).toBe(true);
      expect(isValidIPv4("10.0.0.1")).toBe(true);
      expect(isValidIPv4("255.255.255.255")).toBe(true);
      expect(isValidIPv4("0.0.0.0")).toBe(true);
    });

    it('should return false for invalid IPv4 addresses', () => {
      expect(isValidIPv4("256.1.1.1")).toBe(false);
      expect(isValidIPv4("192.168.1")).toBe(false);
      expect(isValidIPv4("192.168.1.1.1")).toBe(false);
      expect(isValidIPv4("192.168.1.-1")).toBe(false);
      expect(isValidIPv4("abc.def.ghi.jkl")).toBe(false);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidIPv4("")).toBe(true);
      expect(isValidIPv4("   ")).toBe(true);
    });
  });

  describe('isValidIPv6', () => {
    it('should return true for valid IPv6 addresses', () => {
      expect(isValidIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
      expect(isValidIPv6("::1")).toBe(true);
      expect(isValidIPv6("::")).toBe(true);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidIPv6("")).toBe(true);
    });
  });

  describe('isValidIPAddress', () => {
    it('should return true for valid IPv4 addresses', () => {
      expect(isValidIPAddress("192.168.1.1")).toBe(true);
    });

    it('should return true for valid IPv6 addresses', () => {
      expect(isValidIPAddress("::1")).toBe(true);
    });

    it('should return false for invalid IP addresses', () => {
      expect(isValidIPAddress("256.1.1.1")).toBe(false);
      expect(isValidIPAddress("invalid")).toBe(false);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidIPAddress("")).toBe(true);
    });
  });

  describe('isValidMACAddress', () => {
    it('should return true for valid MAC addresses with colons', () => {
      expect(isValidMACAddress("00:1B:44:11:3A:B7")).toBe(true);
      expect(isValidMACAddress("00:1b:44:11:3a:b7")).toBe(true);
    });

    it('should return true for valid MAC addresses with dashes', () => {
      expect(isValidMACAddress("00-1B-44-11-3A-B7")).toBe(true);
    });

    it('should return false for invalid MAC addresses', () => {
      expect(isValidMACAddress("00:1B:44:11:3A")).toBe(false);
      expect(isValidMACAddress("00:1B:44:11:3A:B7:XX")).toBe(false);
      expect(isValidMACAddress("invalid")).toBe(false);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidMACAddress("")).toBe(true);
    });

    it('should handle multiple MAC addresses separated by newlines', () => {
      expect(isValidMACAddress("00:1B:44:11:3A:B7\n00:1B:44:11:3A:B8")).toBe(true);
    });

    it('should handle multiple MAC addresses separated by commas', () => {
      expect(isValidMACAddress("00:1B:44:11:3A:B7,00:1B:44:11:3A:B8")).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("test@.com")).toBe(false);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidEmail("")).toBe(true);
    });
  });

  describe('isValidURL', () => {
    it('should return true for valid URLs', () => {
      expect(isValidURL("https://example.com")).toBe(true);
      expect(isValidURL("http://example.com")).toBe(true);
      expect(isValidURL("https://www.example.com/path")).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidURL("not-a-url")).toBe(false);
      expect(isValidURL("example.com")).toBe(false);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidURL("")).toBe(true);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates in YYYY-MM-DD format', () => {
      expect(isValidDate("2024-01-01")).toBe(true);
      expect(isValidDate("2024-12-31")).toBe(true);
      expect(isValidDate("2000-02-29")).toBe(true); // Leap year
    });

    it('should return false for invalid date formats', () => {
      expect(isValidDate("01-01-2024")).toBe(false);
      expect(isValidDate("2024/01/01")).toBe(false);
      expect(isValidDate("2024-13-01")).toBe(false);
      expect(isValidDate("2024-01-32")).toBe(false);
      expect(isValidDate("invalid")).toBe(false);
    });

    it('should return true for empty string (optional field)', () => {
      expect(isValidDate("")).toBe(true);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber("123")).toBe(true);
      expect(isValidNumber("123.45")).toBe(true);
      expect(isValidNumber("-123")).toBe(true);
      expect(isValidNumber(123)).toBe(true);
      expect(isValidNumber(123.45)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isValidNumber("abc")).toBe(false);
      expect(isValidNumber("12.34.56")).toBe(false);
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
    });

    it('should return true for empty/null/undefined (optional field)', () => {
      expect(isValidNumber("")).toBe(true);
      expect(isValidNumber(null)).toBe(true);
      expect(isValidNumber(undefined)).toBe(true);
    });
  });

  describe('isValidPositiveNumber', () => {
    it('should return true for valid positive numbers', () => {
      expect(isValidPositiveNumber("123")).toBe(true);
      expect(isValidPositiveNumber("123.45")).toBe(true);
      expect(isValidPositiveNumber("0")).toBe(true);
      expect(isValidPositiveNumber(123)).toBe(true);
      expect(isValidPositiveNumber(0)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isValidPositiveNumber("-123")).toBe(false);
      expect(isValidPositiveNumber(-123)).toBe(false);
    });

    it('should return false for invalid numbers', () => {
      expect(isValidPositiveNumber("abc")).toBe(false);
      expect(isValidPositiveNumber(NaN)).toBe(false);
    });

    it('should return true for empty/null/undefined (optional field)', () => {
      expect(isValidPositiveNumber("")).toBe(true);
      expect(isValidPositiveNumber(null)).toBe(true);
      expect(isValidPositiveNumber(undefined)).toBe(true);
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmpty("test")).toBe(true);
      expect(isNotEmpty("  test  ")).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNotEmpty("")).toBe(false);
      expect(isNotEmpty("   ")).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isSelected', () => {
    it('should return true for non-empty strings', () => {
      expect(isSelected("test")).toBe(true);
      expect(isSelected("  test  ")).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isSelected("")).toBe(false);
      expect(isSelected("   ")).toBe(false);
    });

    it('should return true for non-zero numbers', () => {
      expect(isSelected(1)).toBe(true);
      expect(isSelected(-1)).toBe(true);
      expect(isSelected(123.45)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isSelected(0)).toBe(false);
    });

    it('should return true for objects with id', () => {
      expect(isSelected({ id: 1 })).toBe(true);
      expect(isSelected({ id: "test" })).toBe(true);
    });

    it('should return false for objects with null/undefined id', () => {
      expect(isSelected({ id: null })).toBe(false);
      expect(isSelected({ id: undefined })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isSelected(null)).toBe(false);
      expect(isSelected(undefined)).toBe(false);
    });
  });

  describe('validateStepForCreate', () => {
    it('should validate step 0 - require name and category', () => {
      const result = validateStepForCreate(0, {});
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.name).toBe("Asset name is required");
      expect(result.fieldErrors?.category).toBe("Asset type (category) is required");
    });

    it('should pass step 0 with valid name and category', () => {
      const result = validateStepForCreate(0, {
        name: "Test Asset",
        category: 1,
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should validate step 1 - IP and MAC addresses', () => {
      const result = validateStepForCreate(1, {
        ip_address: "256.1.1.1",
        mac_address: "invalid",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.ip_address).toBeDefined();
      expect(result.fieldErrors?.mac_address).toBeDefined();
    });

    it('should pass step 1 with valid IP and MAC addresses', () => {
      const result = validateStepForCreate(1, {
        ip_address: "192.168.1.1",
        mac_address: "00:1B:44:11:3A:B7",
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should validate step 2 - dates', () => {
      const result = validateStepForCreate(2, {
        in_current_state_since: "invalid-date",
        expected_checkin_date: "2024-13-01",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.in_current_state_since).toBeDefined();
      expect(result.fieldErrors?.expected_checkin_date).toBeDefined();
    });

    it('should validate step 3 - numeric fields', () => {
      const result = validateStepForCreate(3, {
        purchase_price: "-100",
        replacement_cost: "invalid",
        useful_life_years: -5,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.purchase_price).toBeDefined();
      expect(result.fieldErrors?.replacement_cost).toBeDefined();
      expect(result.fieldErrors?.useful_life_years).toBeDefined();
    });

    it('should validate step 4 - dates', () => {
      const result = validateStepForCreate(4, {
        acquisition_date: "invalid",
        warranty_expiration: "2024-13-01",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.acquisition_date).toBeDefined();
      expect(result.fieldErrors?.warranty_expiration).toBeDefined();
    });
  });

  describe('validateStepForUpdate', () => {
    it('should allow empty name and category in step 0 (update)', () => {
      const result = validateStepForUpdate(0, {});
      
      expect(result.isValid).toBe(true);
    });

    it('should validate name format if provided in step 0', () => {
      const result = validateStepForUpdate(0, {
        name: "   ",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.name).toBe("Asset name cannot be empty");
    });

    it('should validate category format if provided in step 0 - empty string', () => {
      const result = validateStepForUpdate(0, {
        category: "" as any,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.category).toBe("Asset type (category) cannot be empty");
    });

    it('should validate category format if provided in step 0 - zero number', () => {
      const result = validateStepForUpdate(0, {
        category: 0,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.category).toBe("Asset type (category) cannot be zero");
    });

    it('should pass validation with valid category object in step 0', () => {
      const result = validateStepForUpdate(0, {
        category: mockAssetCategory as any,
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should validate step 1 - IP and MAC addresses if provided', () => {
      const result = validateStepForUpdate(1, {
        ip_address: "256.1.1.1",
      });
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors?.ip_address).toBeDefined();
    });

    it('should pass step 1 with empty fields (update)', () => {
      const result = validateStepForUpdate(1, {});
      
      expect(result.isValid).toBe(true);
    });
  });
})

