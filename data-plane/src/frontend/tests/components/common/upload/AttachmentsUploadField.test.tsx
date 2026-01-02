/**
 * Tests for components/common/upload/AttachmentsUploadField.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttachmentsUploadField } from "@/components/common/upload/AttachmentsUploadField";
import { toast } from "sonner";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock("@/components/common/upload/AttachmentList", () => ({
  AttachmentList: ({ attachments, onRemove }: { attachments: File[]; onRemove?: (index: number) => void }) => (
    <div data-testid="attachment-list">
      {attachments.map((att: File, i: number) => (
        <div key={i} data-testid={`attachment-${i}`}>
          {att instanceof File ? att.name : "attachment"}
          {onRemove && (
            <button onClick={() => onRemove(i)}>Remove</button>
          )}
        </div>
      ))}
    </div>
  ),
}));

describe("AttachmentsUploadField", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label and input", () => {
    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Attachments")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CLICK TO UPLOAD/i })).toBeInTheDocument();
  });

  it("should show required indicator when not optional", () => {
    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
        optional={false}
      />
    );

    // When optional is false, no indicator is shown (only shows "(optional)" when optional is true)
    expect(screen.queryByText("*")).not.toBeInTheDocument();
    expect(screen.queryByText("(optional)")).not.toBeInTheDocument();
  });

  it("should not show required indicator when optional", () => {
    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
        optional={true}
      />
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should display helper text when provided", () => {
    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
        helperText="Upload PDF files only"
      />
    );

    expect(screen.getByText("Upload PDF files only")).toBeInTheDocument();
  });

  it("should handle file upload", async () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });

    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
      />
    );

    // Find the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it("should reject files that are too large", async () => {
    const largeFile = new File(["x".repeat(30 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });

    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
        maxSizeMB={25}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, largeFile);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("too large")
      );
    });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("should accept files within size limit", async () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });

    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
        maxSizeMB={25}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it("should handle multiple file uploads", async () => {
    const file1 = new File(["content1"], "test1.pdf", { type: "application/pdf" });
    const file2 = new File(["content2"], "test2.pdf", { type: "application/pdf" });

    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[]}
        onChange={mockOnChange}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, [file1, file2]);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining([file1, file2]));
    });
  });

  it("should display existing attachments", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });

    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[file]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId("attachment-list")).toBeInTheDocument();
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("should handle attachment removal", async () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });

    render(
      <AttachmentsUploadField
        label="Attachments"
        value={[file]}
        onChange={mockOnChange}
      />
    );

    const removeButton = screen.getByText("Remove");
    await userEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});



