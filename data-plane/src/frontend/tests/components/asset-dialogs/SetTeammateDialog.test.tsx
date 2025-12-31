/**
 * Tests for components/asset-dialogs/SetTeammateDialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetTeammateDialog } from "@/components/apps/assets/pages/detail/dialogs/SetTeammateDialog";
import { api } from "@/lib/utils";

// Mock dependencies
jest.mock("@/lib/utils", () => ({
  api: {
    get: jest.fn(),
  },
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-description">{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

describe("SetTeammateDialog", () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <SetTeammateDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    mockApiGet.mockResolvedValue({
      data: [],
      error: undefined,
      status: 200,
    });

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Set Teammate")).toBeInTheDocument();
  });

  it("should fetch users when dialog opens", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "user1",
        email: "user1@example.com",
        first_name: "John",
        last_name: "Doe",
      },
      {
        id: "2",
        username: "user2",
        email: "user2@example.com",
        first_name: "Jane",
        last_name: "Smith",
      },
    ];

    mockApiGet.mockResolvedValue({
      data: mockUsers,
      error: undefined,
      status: 200,
    });

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/auth/users/");
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("should filter users based on search query", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "user1",
        email: "user1@example.com",
        first_name: "John",
        last_name: "Doe",
      },
      {
        id: "2",
        username: "user2",
        email: "user2@example.com",
        first_name: "Jane",
        last_name: "Smith",
      },
    ];

    mockApiGet.mockResolvedValue({
      data: mockUsers,
      error: undefined,
      status: 200,
    });

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Search teammate/i);
    await userEvent.type(searchInput, "Jane");

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("should filter users by email", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "user1",
        email: "john@example.com",
        first_name: "John",
        last_name: "Doe",
      },
    ];

    mockApiGet.mockResolvedValue({
      data: mockUsers,
      error: undefined,
      status: 200,
    });

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Search teammate/i);
    await userEvent.type(searchInput, "john@example.com");

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should call onSave with user data when save button is clicked", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "user1",
        email: "user1@example.com",
        first_name: "John",
        last_name: "Doe",
      },
    ];

    mockApiGet.mockResolvedValue({
      data: mockUsers,
      error: undefined,
      status: 200,
    });

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const userButton = screen.getByText("John Doe").closest("button");
    if (userButton) {
      await userEvent.click(userButton);
    }

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        userId: "1",
        userName: "John Doe",
      });
    });
  });

  it("should display error message on fetch failure", async () => {
    mockApiGet.mockRejectedValue(new Error("Failed to fetch users"));

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText("Failed to fetch users")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should initialize with currentValue if provided", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "user1",
        email: "user1@example.com",
        first_name: "John",
        last_name: "Doe",
      },
    ];

    mockApiGet.mockResolvedValue({
      data: mockUsers,
      error: undefined,
      status: 200,
    });

    render(
      <SetTeammateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        currentValue="1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });
});

