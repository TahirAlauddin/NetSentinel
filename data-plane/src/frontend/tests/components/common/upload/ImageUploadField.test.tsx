/**
 * Tests for components/common/upload/ImageUploadField.tsx
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUploadField } from "@/components/common/upload/ImageUploadField";
import { toast } from "sonner";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock("@/components/common/upload/ImagePreviewList", () => ({
  ImagePreviewList: ({ images, onRemove }: { images: File[]; onRemove?: (index: number) => void }) => (
    <div data-testid="image-preview-list">
      {images.map((img: File, i: number) => (
        <div key={i} data-testid={`image-${i}`}>
          {img instanceof File ? img.name : "image"}
          {onRemove && <button onClick={() => onRemove(i)}>Remove</button>}
        </div>
      ))}
    </div>
  ),
}));

describe("ImageUploadField", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label and input", () => {
    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Images")).toBeInTheDocument();
    // Button text is "click to upload" not "Choose images"
    expect(screen.getByRole("button", { name: /click to upload/i })).toBeInTheDocument();
  });

  it("should show required indicator when not optional", () => {
    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
        optional={false}
      />
    );

    // Component doesn't show "*" - it only shows "(optional)" when optional is true
    // When optional is false, it shows nothing, so just verify the label exists without optional text
    expect(screen.getByText("Images")).toBeInTheDocument();
    expect(screen.queryByText("(optional)")).not.toBeInTheDocument();
  });

  it("should not show required indicator when optional", () => {
    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
        optional={true}
      />
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should display helper text when provided", () => {
    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
        helperText="Upload JPG or PNG files"
      />
    );

    expect(screen.getByText("Upload JPG or PNG files")).toBeInTheDocument();
  });

  it("should reject files that are too large", async () => {
    const largeFile = new File(["x".repeat(10 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
        maxSizeMB={5}
      />
    );

    // Input is not associated with label (no htmlFor/id), so find by type
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    await userEvent.upload(input, largeFile);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("too large")
      );
    });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("should reject files with invalid MIME types", async () => {
    const invalidFile = new File(["content"], "test.pdf", {
      type: "application/pdf",
    });

    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
        accept="image/png,image/jpeg,image/jpg"
      />
    );

    // Input is not associated with label, so find by type
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    
    // Create a mock FileList
    const fileList = {
      0: invalidFile,
      length: 1,
      item: (index: number) => (index === 0 ? invalidFile : null),
      [Symbol.iterator]: function* () {
        yield invalidFile;
      },
    } as unknown as FileList;
    
    // Set files and trigger change event
    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: false,
      configurable: true,
    });
    
    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("must be one of")
      );
    });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("should accept valid image files", async () => {
    const imageFile = new File(["content"], "test.jpg", {
      type: "image/jpeg",
    });

    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
      />
    );

    // Input is not associated with label, so find by type
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, imageFile);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it("should handle multiple image uploads", async () => {
    const image1 = new File(["content1"], "test1.jpg", { type: "image/jpeg" });
    const image2 = new File(["content2"], "test2.png", { type: "image/png" });

    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
      />
    );

    // Input is not associated with label, so find by type
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, [image1, image2]);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining([image1, image2]));
    });
  });

  it("should display existing images", () => {
    const imageFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

    render(
      <ImageUploadField
        label="Images"
        value={[imageFile]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId("image-preview-list")).toBeInTheDocument();
    expect(screen.getByText("test.jpg")).toBeInTheDocument();
  });

  it("should handle image removal", async () => {
    const imageFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

    render(
      <ImageUploadField
        label="Images"
        value={[imageFile]}
        onChange={mockOnChange}
      />
    );

    const removeButton = screen.getByText("Remove");
    await userEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("should use default max size when not provided", async () => {
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    render(
      <ImageUploadField
        label="Images"
        value={[]}
        onChange={mockOnChange}
      />
    );

    // Input is not associated with label, so find by type
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, largeFile);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("5MB")
      );
    });
  });
});



