/**
 * Tests for components/asset-dialogs/NotesDialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesDialog } from "@/components/apps/assets/pages/detail/dialogs/NotesDialog";

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

describe("NotesDialog", () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <NotesDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    // Check for the dialog title specifically (there's also a button with "Add Note")
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Add Note");
  });

  it("should render note textarea", () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByLabelText(/Note/i)).toBeInTheDocument();
  });

  it("should disable save button when note is empty", () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    const saveButton = screen.getByRole("button", { name: /Add Note/i });
    expect(saveButton).toBeDisabled();
  });

  it("should disable save button when note is only whitespace", () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const noteTextarea = screen.getByLabelText(/Note/i);
    userEvent.type(noteTextarea, "   ");

    const saveButton = screen.getByRole("button", { name: /Add Note/i });
    expect(saveButton).toBeDisabled();
  });

  it("should enable save button when note has content", async () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const noteTextarea = screen.getByLabelText(/Note/i);
    await userEvent.type(noteTextarea, "Test note");

    const saveButton = screen.getByRole("button", { name: /Add Note/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("should call onSave with note text when save button is clicked", async () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const noteTextarea = screen.getByLabelText(/Note/i);
    await userEvent.type(noteTextarea, "This is a test note");

    const saveButton = screen.getByRole("button", { name: /Add Note/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith("This is a test note");
    });
  });

  it("should reset form and close dialog after save", async () => {
    render(
      <NotesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const noteTextarea = screen.getByLabelText(/Note/i);
    await userEvent.type(noteTextarea, "Test note");

    const saveButton = screen.getByRole("button", { name: /Add Note/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should call onOpenChange when cancel button is clicked", async () => {
    render(
      <NotesDialog
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



