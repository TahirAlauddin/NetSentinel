/**
 * Tests for app/(auth)/login/page.tsx
 */

import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";
import { signIn } from "next-auth/react";

// Mock dependencies
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

const push = jest.fn();
const getSearchParam = jest.fn().mockReturnValue(null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
  useSearchParams: () => ({
    get: getSearchParam,
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe("LoginPage", () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

  beforeEach(() => {
    jest.clearAllMocks();
    getSearchParam.mockReturnValue(null);
  });

  it("should render login form", () => {
    render(<LoginPage />);
    expect(screen.getByText("Sign in to NetSentinel")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("should show error when username is missing", async () => {
    render(<LoginPage />);

    const form = screen.getByRole("button", { name: /Sign In/i }).closest("form");
    const passwordInput = screen.getByLabelText("Password");
    const usernameInput = screen.getByLabelText("Username");

    // Fill both fields first to bypass HTML5 validation
    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    // Clear username to simulate missing field
    await userEvent.clear(usernameInput);
    
    // Submit form using fireEvent to bypass HTML5 validation
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter both username and password/i)
      ).toBeInTheDocument();
    });
  });

  it("should show error when password is missing", async () => {
    render(<LoginPage />);

    const form = screen.getByRole("button", { name: /Sign In/i }).closest("form");
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");

    // Fill both fields first to bypass HTML5 validation
    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    // Clear password to simulate missing field
    await userEvent.clear(passwordInput);
    
    // Submit form using fireEvent to bypass HTML5 validation
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter both username and password/i)
      ).toBeInTheDocument();
    });
  });

  it("should submit form with credentials", async () => {
    mockSignIn.mockResolvedValue({ error: null, ok: true, status: 200, url: null });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        username: "testuser",
        password: "password123",
        redirect: false,
      });
    });
  });

  it("should show error on invalid credentials", async () => {
    mockSignIn.mockResolvedValue({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "wrongpassword");
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid username or password.")).toBeInTheDocument();
    });
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("should navigate to dashboard on successful login", async () => {
    mockSignIn.mockResolvedValue({ error: null, ok: true, status: 200, url: null });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should handle callbackUrl from search params", async () => {
    getSearchParam.mockImplementation((key: string) => {
      if (key === "callbackUrl") return "/assets";
      return null;
    });

    mockSignIn.mockResolvedValue({ error: null, ok: true, status: 200, url: null });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/assets");
    });
  });

  it("should show loading state during submission", async () => {
    mockSignIn.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Signing In...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it("should handle server errors", async () => {
    mockSignIn.mockRejectedValue(new Error("Server error"));

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Server error. Please try again.")).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});

