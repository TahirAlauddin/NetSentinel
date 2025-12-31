/**
 * Tests for app/(auth)/logout/page.tsx
 */

import { render, screen } from "@testing-library/react";
import LogoutPage from "@/app/(auth)/logout/page";
import { signOut } from "next-auth/react";

// Mock dependencies
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

describe("LogoutPage", () => {
  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading spinner", () => {
    render(<LogoutPage />);
    expect(screen.getByText("Signing out...")).toBeInTheDocument();
  });

  it("should call signOut on mount", () => {
    render(<LogoutPage />);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("should only call signOut once", () => {
    const { rerender } = render(<LogoutPage />);
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    rerender(<LogoutPage />);
    // Should still be called only once due to useEffect dependency array
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});



