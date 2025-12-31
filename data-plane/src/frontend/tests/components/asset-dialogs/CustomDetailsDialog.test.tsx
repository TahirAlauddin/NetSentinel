/**
 * Tests for components/asset-dialogs/CustomDetailsDialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomDetailsDialog } from "@/components/apps/assets/pages/detail/dialogs/CustomDetailsDialog";

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

describe("CustomDetailsDialog", () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <CustomDetailsDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(
      <CustomDetailsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add Custom Details")).toBeInTheDocument();
  });

  it("should render key and value fields", () => {
    render(
      <CustomDetailsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByLabelText(/Field Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Value/i)).toBeInTheDocument();
  });

  it("should disable save button when fields are empty", () => {
    render(
      <CustomDetailsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    const saveButton = screen.getByRole("button", { name: /Add Detail/i });
    expect(saveButton).toBeDisabled();
  });

  it("should enable save button when both fields are filled", async () => {
    render(
      <CustomDetailsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await userEvent.type(screen.getByLabelText(/Field Name/i), "Room Number");
    await userEvent.type(screen.getByLabelText(/Value/i), "101A");

    const saveButton = screen.getByRole("button", { name: /Add Detail/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("should call onSave with form data when save button is clicked", async () => {
    render(
      <CustomDetailsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await userEvent.type(screen.getByLabelText(/Field Name/i), "Room Number");
    await userEvent.type(screen.getByLabelText(/Value/i), "101A");

    const saveButton = screen.getByRole("button", { name: /Add Detail/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        key: "Room Number",
        value: "101A",
      });
    });
  });

  it("should reset form and close dialog after save", async () => {
    render(
      <CustomDetailsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await userEvent.type(screen.getByLabelText(/Field Name/i), "Room Number");
    await userEvent.type(screen.getByLabelText(/Value/i), "101A");

    const saveButton = screen.getByRole("button", { name: /Add Detail/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should call onOpenChange when cancel button is clicked", async () => {
    render(
      <CustomDetailsDialog
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



