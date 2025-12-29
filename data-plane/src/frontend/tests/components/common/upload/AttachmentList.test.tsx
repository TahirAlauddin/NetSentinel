/**
 * Tests for components/common/upload/AttachmentList.tsx
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttachmentList } from "@/components/common/upload/AttachmentList";

describe("AttachmentList", () => {
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when attachments array is empty", () => {
    const { container } = render(
      <AttachmentList attachments={[]} onRemove={mockOnRemove} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render file attachments with File objects", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    render(<AttachmentList attachments={[file]} onRemove={mockOnRemove} />);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("should render file size for File objects", () => {
    const file = new File(["x".repeat(1024 * 1024)], "test.pdf", {
      type: "application/pdf",
    });
    render(<AttachmentList attachments={[file]} onRemove={mockOnRemove} />);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText(/1\.00 MB/i)).toBeInTheDocument();
  });

  it("should render string attachments", () => {
    render(
      <AttachmentList attachments={["/path/to/file.pdf"]} onRemove={mockOnRemove} />
    );

    expect(screen.getByText("file.pdf")).toBeInTheDocument();
  });

  it("should render object attachments with file property", () => {
    render(
      <AttachmentList
        attachments={[{ file: "/path/to/document.pdf" }]}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("should render default name when file path cannot be extracted", () => {
    render(
      <AttachmentList attachments={[{ file: "" }]} onRemove={mockOnRemove} />
    );

    expect(screen.getByText("Attachment")).toBeInTheDocument();
  });

  it("should call onRemove when remove button is clicked", async () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    render(<AttachmentList attachments={[file]} onRemove={mockOnRemove} />);

    const removeButton = screen.getByLabelText("Remove attachment");
    await userEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith(0);
  });

  it("should not render remove button when onRemove is not provided", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    render(<AttachmentList attachments={[file]} />);

    expect(screen.queryByLabelText("Remove attachment")).not.toBeInTheDocument();
  });

  it("should render multiple attachments", () => {
    const files = [
      new File(["content1"], "file1.pdf", { type: "application/pdf" }),
      new File(["content2"], "file2.pdf", { type: "application/pdf" }),
    ];
    render(<AttachmentList attachments={files} onRemove={mockOnRemove} />);

    expect(screen.getByText("file1.pdf")).toBeInTheDocument();
    expect(screen.getByText("file2.pdf")).toBeInTheDocument();
  });

  it("should call onRemove with correct index for each attachment", async () => {
    const files = [
      new File(["content1"], "file1.pdf", { type: "application/pdf" }),
      new File(["content2"], "file2.pdf", { type: "application/pdf" }),
    ];
    render(<AttachmentList attachments={files} onRemove={mockOnRemove} />);

    const removeButtons = screen.getAllByLabelText("Remove attachment");
    await userEvent.click(removeButtons[1]);

    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });
});



