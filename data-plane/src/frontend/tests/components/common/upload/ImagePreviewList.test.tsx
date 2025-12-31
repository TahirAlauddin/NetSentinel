/**
 * Tests for components/common/upload/ImagePreviewList.tsx
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImagePreviewList } from "@/components/common/upload/ImagePreviewList";

// Mock window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

describe("ImagePreviewList", () => {
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return null when images array is empty", () => {
    const { container } = render(
      <ImagePreviewList images={[]} onRemove={mockOnRemove} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render File images with preview", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    render(<ImagePreviewList images={[file]} onRemove={mockOnRemove} />);

    expect(screen.getByAltText("test.jpg")).toBeInTheDocument();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it("should render string URL images", () => {
    render(
      <ImagePreviewList images={["https://example.com/image.jpg"]} onRemove={mockOnRemove} />
    );

    const img = screen.getByAltText("image.jpg");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("should render object images with image property", () => {
    render(
      <ImagePreviewList
        images={[{ image: "https://example.com/photo.jpg" }]}
        onRemove={mockOnRemove}
      />
    );

    const img = screen.getByAltText("photo.jpg");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("should open image in new window when clicked", async () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    render(<ImagePreviewList images={[file]} onRemove={mockOnRemove} />);

    const imageButton = screen.getByAltText("test.jpg").closest("button");
    if (imageButton) {
      await userEvent.click(imageButton);
    }

    expect(mockWindowOpen).toHaveBeenCalledWith(
      "blob:mock-url",
      "_blank",
      "noopener"
    );
  });

  it("should call onRemove when remove button is clicked", async () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    render(<ImagePreviewList images={[file]} onRemove={mockOnRemove} />);

    // Hover to show remove button (in real implementation)
    const removeButton = screen.getByLabelText("Remove image");
    await userEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith(0);
  });

  it("should not render remove button when onRemove is not provided", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    render(<ImagePreviewList images={[file]} />);

    expect(screen.queryByLabelText("Remove image")).not.toBeInTheDocument();
  });

  it("should revoke object URLs on unmount", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const { unmount } = render(
      <ImagePreviewList images={[file]} onRemove={mockOnRemove} />
    );

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should render multiple images", () => {
    const files = [
      new File(["content1"], "image1.jpg", { type: "image/jpeg" }),
      new File(["content2"], "image2.jpg", { type: "image/jpeg" }),
    ];
    render(<ImagePreviewList images={files} onRemove={mockOnRemove} />);

    expect(screen.getByAltText("image1.jpg")).toBeInTheDocument();
    expect(screen.getByAltText("image2.jpg")).toBeInTheDocument();
  });

  it("should display image label", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    render(<ImagePreviewList images={[file]} onRemove={mockOnRemove} />);

    expect(screen.getByText("test.jpg")).toBeInTheDocument();
  });
});



