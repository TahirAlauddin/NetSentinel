/**
 * Tests for components/debug/auth-dialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthDialog from "@/components/debug/auth-dialog";

// Mock config
jest.mock("@/lib/config", () => ({
  apiConfig: {
    clientBaseUrl: "http://localhost:8000/api/v1",
  },
  authConfig: {
    url: "http://localhost:3000",
    secret: "test-secret",
  },
  appConfig: {
    nodeEnv: "test",
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("AuthDialog", () => {
  const mockOnClose = jest.fn();
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render debug dialog when open", () => {
    const DebugPopup = AuthDialog();
    render(<DebugPopup isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Environment Variables/i)).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    const DebugPopup = AuthDialog();
    const { container } = render(<DebugPopup isOpen={false} onClose={mockOnClose} />);

    // Dialog should not be visible when closed
    expect(container.firstChild).toBeNull();
  });

  it("should display environment variables", () => {
    const DebugPopup = AuthDialog();
    render(<DebugPopup isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/NEXT_PUBLIC_API_URL/i)).toBeInTheDocument();
    expect(screen.getByText(/NEXTAUTH_URL/i)).toBeInTheDocument();
    expect(screen.getByText(/NEXTAUTH_SECRET/i)).toBeInTheDocument();
    expect(screen.getByText(/NODE_ENV/i)).toBeInTheDocument();
  });

  it("should test backend connection when button is clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      json: async () => ({ status: "ok" }),
    } as Response);

    const DebugPopup = AuthDialog();
    render(<DebugPopup isOpen={true} onClose={mockOnClose} />);

    const testButton = screen.getByRole("button", { name: /Test Backend Connection/i });
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("should handle connection errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const DebugPopup = AuthDialog();
    render(<DebugPopup isOpen={true} onClose={mockOnClose} />);

    const testButton = screen.getByRole("button", { name: /Test Backend Connection/i });
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("should call onClose when close button is clicked", async () => {
    const DebugPopup = AuthDialog();
    render(<DebugPopup isOpen={true} onClose={mockOnClose} />);

    // The close button uses "×" character, not "Close" text
    const closeButton = screen.getByText("×");
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});



