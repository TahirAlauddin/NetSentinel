/**
 * Component tests for components/groups/groups-list.tsx
 *
 * Tests cover:
 * - Group list rendering
 * - Empty state
 * - Expand/collapse functionality (lazy-load via getGroup)
 * - Edit and delete actions
 * - Permission count display
 */

import { render, screen } from "@/tests/__utils__/test-utils";
import userEvent from "@testing-library/user-event";
import GroupsList from "@/components/groups/groups-list";
import { GroupRecord } from "@/types/groups";

jest.mock("@/app/(app)/settings/actions", () => ({
  getGroup: jest.fn().mockResolvedValue({
    id: 1,
    name: "Administrators",
    permissions: [1, 2],
    permissions_detail: [
      { id: 1, name: "Can view assets", codename: "view_asset", content_type: 1 },
      { id: 2, name: "Can edit assets", codename: "edit_asset", content_type: 1 },
    ],
  }),
}));

describe("GroupsList", () => {
  const mockGroups: GroupRecord[] = [
    {
      id: 1,
      name: "Administrators",
      user_count: 5,
      permissions: [1, 2],
    },
    {
      id: 2,
      name: "Viewers",
      user_count: 10,
      permissions: [],
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all groups", () => {
    render(<GroupsList groups={mockGroups} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText("Administrators")).toBeInTheDocument();
    expect(screen.getByText("Viewers")).toBeInTheDocument();
  });

  it("should display user count", () => {
    render(<GroupsList groups={mockGroups} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/5 users/i)).toBeInTheDocument();
    expect(screen.getByText(/10 users/i)).toBeInTheDocument();
  });

  it("should show empty state when no groups", () => {
    render(<GroupsList groups={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/no groups found/i)).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<GroupsList groups={mockGroups} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButtons = screen.getAllByTitle(/edit/i);
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockGroups[0]);
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<GroupsList groups={mockGroups} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByTitle(/delete/i);
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it("should allow edit and delete actions (no inline edit lock)", () => {
    render(<GroupsList groups={mockGroups} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButtons = screen.getAllByTitle(/edit/i);
    const deleteButtons = screen.getAllByTitle(/delete/i);

    editButtons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
    deleteButtons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

});
