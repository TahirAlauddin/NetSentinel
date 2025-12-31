/**
 * Tests for components/asset-dialogs/SoftwareDialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SoftwareDialog } from "@/components/apps/assets/pages/detail/dialogs/SoftwareDialog";

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

// Mock select component
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder || "Select..."}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button
      data-testid={`select-item-${value}`}
      onClick={() => {
        const select = document.querySelector('[data-testid="select"]');
        if (select && (select as any).onValueChange) {
          (select as any).onValueChange(value);
        }
      }}
    >
      {children}
    </button>
  ),
}));

describe("SoftwareDialog", () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <SoftwareDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(
      <SoftwareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    // The title "Add Software" is inside DialogTitle which is rendered by the mock
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Add Software");
  });

  it("should render all form fields", () => {
    render(
      <SoftwareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByLabelText(/Software Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Version/i)).toBeInTheDocument();
    // License Type is a Select component - check for label with htmlFor="license-type"
    const licenseTypeLabel = screen.getByText(/^License Type$/i);
    expect(licenseTypeLabel).toBeInTheDocument();
    expect(licenseTypeLabel).toHaveAttribute('for', 'license-type');
    expect(screen.getByLabelText(/License Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Installed Date/i)).toBeInTheDocument();
  });

  it("should disable save button when required fields are empty", () => {
    render(
      <SoftwareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    const saveButton = screen.getByRole("button", { name: /Add Software/i });
    expect(saveButton).toBeDisabled();
  });

  it("should enable save button when required fields are filled", async () => {
    render(
      <SoftwareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/Software Name/i);
    const versionInput = screen.getByLabelText(/Version/i);

    await userEvent.type(nameInput, "Microsoft Office");
    await waitFor(() => {
      expect(nameInput).toHaveValue("Microsoft Office");
    });

    await userEvent.type(versionInput, "2021");
    await waitFor(() => {
      expect(versionInput).toHaveValue("2021");
    });

    const saveButton = screen.getByRole("button", { name: /Add Software/i });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it("should call onSave with form data when save button is clicked", async () => {
    render(
      <SoftwareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/Software Name/i);
    const versionInput = screen.getByLabelText(/Version/i);
    const licenseKeyInput = screen.getByLabelText(/License Key/i);
    const installedDateInput = screen.getByLabelText(/Installed Date/i);

    await userEvent.type(nameInput, "Microsoft Office");
    await waitFor(() => {
      expect(nameInput).toHaveValue("Microsoft Office");
    });

    await userEvent.type(versionInput, "2021");
    await waitFor(() => {
      expect(versionInput).toHaveValue("2021");
    });

    await userEvent.type(licenseKeyInput, "ABC123");
    await waitFor(() => {
      expect(licenseKeyInput).toHaveValue("ABC123");
    });

    await userEvent.type(installedDateInput, "2024-01-01");
    await waitFor(() => {
      expect(installedDateInput).toHaveValue("2024-01-01");
    });

    const saveButton = screen.getByRole("button", { name: /Add Software/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: "Microsoft Office",
        version: "2021",
        licenseType: "",
        licenseKey: "ABC123",
        installedDate: "2024-01-01",
      });
    });
  });

  it("should reset form and close dialog after save", async () => {
    render(
      <SoftwareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/Software Name/i);
    const versionInput = screen.getByLabelText(/Version/i);

    await userEvent.type(nameInput, "Microsoft Office");
    await waitFor(() => {
      expect(nameInput).toHaveValue("Microsoft Office");
    });

    await userEvent.type(versionInput, "2021");
    await waitFor(() => {
      expect(versionInput).toHaveValue("2021");
    });

    const saveButton = screen.getByRole("button", { name: /Add Software/i });
    await userEvent.click(saveButton);

    // Wait for all state updates to complete - check that form is reset and dialog closes
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      // Verify form is reset by checking inputs are empty
      expect(nameInput).toHaveValue("");
      expect(versionInput).toHaveValue("");
    });
  });

  it("should call onOpenChange when cancel button is clicked", async () => {
    render(
      <SoftwareDialog
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
