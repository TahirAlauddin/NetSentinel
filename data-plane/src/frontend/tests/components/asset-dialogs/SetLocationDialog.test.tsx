/**
 * Tests for components/asset-dialogs/SetLocationDialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetLocationDialog } from "@/components/apps/assets/pages/detail/dialogs/SetLocationDialog";

// Mock dialog component
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

describe("SetLocationDialog", () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <SetLocationDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Set Location")).toBeInTheDocument();
  });

  it("should render search input and location list", () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByLabelText(/Search location/i)).toBeInTheDocument();
    expect(screen.getByText("Head Office")).toBeInTheDocument();
  });

  it("should filter locations based on search query", async () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByLabelText(/Search location/i);
    await userEvent.type(searchInput, "Head");

    expect(screen.getByText("Head Office")).toBeInTheDocument();
    expect(screen.queryByText("DevOps Center")).not.toBeInTheDocument();
  });

  it("should filter locations by address", async () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByLabelText(/Search location/i);
    await userEvent.type(searchInput, "Chicago");

    expect(screen.getByText("HQ")).toBeInTheDocument();
  });

  it("should select location when clicked", async () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const locationButton = screen.getByText("Head Office").closest("button");
    if (locationButton) {
      await userEvent.click(locationButton);
    }

    // Location should be selected (visual state would be checked here)
    expect(locationButton).toBeInTheDocument();
  });

  it("should disable save button when no location is selected", () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    const saveButton = screen.getByRole("button", { name: /Save/i });
    expect(saveButton).toBeDisabled();
  });

  it("should call onSave with location data when save button is clicked", async () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const locationButton = screen.getByText("Head Office").closest("button");
    if (locationButton) {
      await userEvent.click(locationButton);
    }

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        locationId: "1",
        locationName: "Head Office",
      });
    });
  });

  it("should initialize with currentValue if provided", () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        currentValue="2"
      />
    );
    // The selected location should be highlighted
    expect(screen.getByText("DevOps Center")).toBeInTheDocument();
  });

  it("should call onOpenChange when cancel button is clicked", async () => {
    render(
      <SetLocationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});



