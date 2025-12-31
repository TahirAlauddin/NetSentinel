/**
 * Tests for error-handler.ts
 */

import {
  ErrorType,
  getErrorTypeFromStatus,
  getErrorTypeFromError,
  getUserFriendlyMessage,
  handleApiError,
  handleCaughtError,
  handleError,
  isValidationError,
  isNetworkError,
  isAuthenticationError,
  isAuthorizationError,
  logError,
  type AppError,
} from "@/lib/error-handler";
import type { BaseApiResponse } from "@/types/api-client";

describe("error-handler", () => {
  describe("getErrorTypeFromStatus", () => {
    it("should return AUTHENTICATION for 401", () => {
      expect(getErrorTypeFromStatus(401)).toBe(ErrorType.AUTHENTICATION);
    });

    it("should return AUTHORIZATION for 403", () => {
      expect(getErrorTypeFromStatus(403)).toBe(ErrorType.AUTHORIZATION);
    });

    it("should return NOT_FOUND for 404", () => {
      expect(getErrorTypeFromStatus(404)).toBe(ErrorType.NOT_FOUND);
    });

    it("should return VALIDATION for 422", () => {
      expect(getErrorTypeFromStatus(422)).toBe(ErrorType.VALIDATION);
    });

    it("should return VALIDATION for other 4xx status codes", () => {
      expect(getErrorTypeFromStatus(400)).toBe(ErrorType.VALIDATION);
      expect(getErrorTypeFromStatus(405)).toBe(ErrorType.VALIDATION);
      expect(getErrorTypeFromStatus(409)).toBe(ErrorType.VALIDATION);
    });

    it("should return SERVER for 5xx status codes", () => {
      expect(getErrorTypeFromStatus(500)).toBe(ErrorType.SERVER);
      expect(getErrorTypeFromStatus(502)).toBe(ErrorType.SERVER);
      expect(getErrorTypeFromStatus(503)).toBe(ErrorType.SERVER);
    });

    it("should return UNKNOWN for other status codes", () => {
      expect(getErrorTypeFromStatus(200)).toBe(ErrorType.UNKNOWN);
      expect(getErrorTypeFromStatus(300)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe("getErrorTypeFromError", () => {
    it("should return NETWORK for TypeError with fetch in message", () => {
      const error = new TypeError("Failed to fetch");
      expect(getErrorTypeFromError(error)).toBe(ErrorType.NETWORK);
    });

    it("should return NETWORK for AbortError", () => {
      const error = new Error("Request aborted");
      error.name = "AbortError";
      expect(getErrorTypeFromError(error)).toBe(ErrorType.NETWORK);
    });

    it("should return UNKNOWN for other errors", () => {
      const error = new Error("Some other error");
      expect(getErrorTypeFromError(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("should return network error message", () => {
      const error: AppError = {
        type: ErrorType.NETWORK,
        message: "Network error",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toContain("connect to the server");
    });

    it("should return authentication error message", () => {
      const error: AppError = {
        type: ErrorType.AUTHENTICATION,
        message: "Auth error",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toContain("session has expired");
    });

    it("should return authorization error message", () => {
      const error: AppError = {
        type: ErrorType.AUTHORIZATION,
        message: "Forbidden",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toContain("don't have permission");
    });

    it("should return not found error message", () => {
      const error: AppError = {
        type: ErrorType.NOT_FOUND,
        message: "Not found",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toContain("not found");
    });

    it("should return validation error message with custom message", () => {
      const error: AppError = {
        type: ErrorType.VALIDATION,
        message: "Invalid input",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toBe("Invalid input");
    });

    it("should return validation error default message when no message", () => {
      const error: AppError = {
        type: ErrorType.VALIDATION,
        message: "",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toContain("check your input");
    });

    it("should return server error message", () => {
      const error: AppError = {
        type: ErrorType.SERVER,
        message: "Server error",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toContain("server error");
    });

    it("should return default message for unknown errors", () => {
      const error: AppError = {
        type: ErrorType.UNKNOWN,
        message: "Unknown error",
        userMessage: "",
      };
      expect(getUserFriendlyMessage(error)).toBe("Unknown error");
    });
  });

  describe("handleApiError", () => {
    it("should handle API error with status code", () => {
      const response: BaseApiResponse<unknown> = {
        status: 404,
        error: "Not found",
        data: null,
      };

      const result = handleApiError(response);

      expect(result.type).toBe(ErrorType.NOT_FOUND);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe("Not found");
    });

    it("should handle API error with errorData", () => {
      const response: BaseApiResponse<unknown> = {
        status: 422,
        error: "Validation failed",
        errorData: {
          name: ["Required"],
        },
        data: null,
      };

      const result = handleApiError(response);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.fieldErrors).toEqual({ name: ["Required"] });
    });

    it("should handle API error without status", () => {
      const response: BaseApiResponse<unknown> = {
        error: "Unknown error",
        data: null,
        status: 0,
      };

      const result = handleApiError(response);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe("Unknown error");
    });
  });

  describe("handleCaughtError", () => {
    it("should handle Error instance", () => {
      const error = new Error("Test error");
      const result = handleCaughtError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe("Test error");
      expect(result.originalError).toBe(error);
    });

    it("should handle string error", () => {
      const error = "String error";
      const result = handleCaughtError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe("String error");
    });

    it("should handle network error", () => {
      const error = new TypeError("Failed to fetch");
      const result = handleCaughtError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
    });

    it("should handle unknown error type", () => {
      const error = { some: "object" };
      const result = handleCaughtError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe("An unexpected error occurred");
    });
  });

  describe("handleError", () => {
    it("should handle API response error", () => {
      const response: BaseApiResponse<unknown> = {
        status: 401,
        error: "Unauthorized",
        data: null,
      };

      const result = handleError(response);

      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.statusCode).toBe(401);
    });

    it("should handle caught error", () => {
      const error = new Error("Test error");
      const result = handleError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe("Test error");
    });

    it("should log error with context", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error - NODE_ENV is readonly but we need to mock it for testing
      process.env.NODE_ENV = "development";

      const error = new Error("Test error");
      handleError(error, { userId: "123" });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      // @ts-expect-error - NODE_ENV is readonly but we need to restore it
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("error type checkers", () => {
    it("isValidationError should return true for validation errors", () => {
      const error: AppError = {
        type: ErrorType.VALIDATION,
        message: "Validation error",
        userMessage: "",
      };
      expect(isValidationError(error)).toBe(true);
    });

    it("isNetworkError should return true for network errors", () => {
      const error: AppError = {
        type: ErrorType.NETWORK,
        message: "Network error",
        userMessage: "",
      };
      expect(isNetworkError(error)).toBe(true);
    });

    it("isAuthenticationError should return true for auth errors", () => {
      const error: AppError = {
        type: ErrorType.AUTHENTICATION,
        message: "Auth error",
        userMessage: "",
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it("isAuthorizationError should return true for authorization errors", () => {
      const error: AppError = {
        type: ErrorType.AUTHORIZATION,
        message: "Forbidden",
        userMessage: "",
      };
      expect(isAuthorizationError(error)).toBe(true);
    });
  });

  describe("logError", () => {
    it("should log error in development", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error - NODE_ENV is readonly but we need to mock it for testing
      process.env.NODE_ENV = "development";

      const error: AppError = {
        type: ErrorType.NETWORK,
        message: "Test error",
        userMessage: "User message",
        statusCode: 500,
      };

      logError(error, { context: "test" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error occurred:",
        expect.objectContaining({
          type: ErrorType.NETWORK,
          message: "Test error",
        })
      );

      consoleSpy.mockRestore();
      // @ts-expect-error - NODE_ENV is readonly but we need to restore it
      process.env.NODE_ENV = originalEnv;
    });

    it("should not log in production", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error - NODE_ENV is readonly but we need to mock it for testing
      process.env.NODE_ENV = "production";

      const error: AppError = {
        type: ErrorType.NETWORK,
        message: "Test error",
        userMessage: "",
      };

      logError(error);

      // Should not be called in production
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      // @ts-expect-error - NODE_ENV is readonly but we need to restore it
      process.env.NODE_ENV = originalEnv;
    });
  });
});



