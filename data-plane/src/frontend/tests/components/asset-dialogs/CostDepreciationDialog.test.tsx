/**
 * Tests for components/asset-dialogs/CostDepreciationDialog.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CostDepreciationDialog } from "@/components/apps/assets/pages/detail/dialogs/CostDepreciationDialog";

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

describe("CostDepreciationDialog", () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <CostDepreciationDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(
      <CostDepreciationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Cost & Depreciation")).toBeInTheDocument();
  });

  it("should render all form fields", () => {
    render(
      <CostDepreciationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByLabelText(/Purchase Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Replacement Cost/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Salvage Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Useful Life/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Approaching End of Life/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PO Number/i)).toBeInTheDocument();
  });

  it("should initialize with current values if provided", () => {
    const currentValues = {
      purchasePrice: 1000,
      replacementCost: 1200,
      poNumber: "PO-123",
    };

    render(
      <CostDepreciationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        currentValues={currentValues}
      />
    );

    expect(screen.getByLabelText(/Purchase Price/i)).toHaveValue("1000");
    expect(screen.getByLabelText(/Replacement Cost/i)).toHaveValue("1200");
    expect(screen.getByLabelText(/PO Number/i)).toHaveValue("PO-123");
  });

  it("should call onSave with parsed numeric values", async () => {
    render(
      <CostDepreciationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await userEvent.type(screen.getByLabelText(/Purchase Price/i), "1000.50");
    await userEvent.type(screen.getByLabelText(/Replacement Cost/i), "1200.75");
    await userEvent.type(screen.getByLabelText(/Useful Life/i), "5");
    await userEvent.type(screen.getByLabelText(/PO Number/i), "PO-123");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        purchasePrice: 1000.5,
        replacementCost: 1200.75,
        salvageValue: undefined,
        usefulLife: 5,
        approachingEndOfLife: undefined,
        poNumber: "PO-123",
      });
    });
  });

  it("should handle empty values as undefined", async () => {
    render(
      <CostDepreciationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        purchasePrice: undefined,
        replacementCost: undefined,
        salvageValue: undefined,
        usefulLife: undefined,
        approachingEndOfLife: undefined,
        poNumber: undefined,
      });
    });
  });

  it("should call onOpenChange when cancel button is clicked", async () => {
    render(
      <CostDepreciationDialog
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



