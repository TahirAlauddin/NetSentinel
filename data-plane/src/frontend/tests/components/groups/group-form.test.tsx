/**
 * Component tests for components/groups/group-form.tsx
 */

import { render, screen, waitFor } from "@/tests/__utils__/test-utils";
import userEvent from "@testing-library/user-event";
import GroupForm from "@/components/groups/group-form";
import type { UseGroupFormReturn } from "@/hooks/use-group-form";
import { buildEmptyAppAccess } from "@/constants/permissions-by-app";


describe("GroupForm", () => {
  const mockOnSubmit = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  });
  const mockOnCancel = jest.fn();
  const mockSetName = jest.fn();

  function makeForm(overrides: Partial<UseGroupFormReturn> = {}): UseGroupFormReturn {
    return {
      name: "",
      setName: mockSetName,
      appAccess: buildEmptyAppAccess(),
      setAppAccess: jest.fn(),
      initialize: jest.fn(),
      reset: jest.fn(),
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render form fields", async () => {
    render(
      <GroupForm
        form={makeForm()}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    expect(screen.getByText(/group permissions/i)).toBeInTheDocument();
    expect(await screen.findByText(/NetSentinel App Access/i)).toBeInTheDocument();
  });

  it("should update name when input changes", async () => {
    const user = userEvent.setup();
    render(
      <GroupForm
        form={makeForm()}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    const nameInput = screen.getByLabelText(/group name/i);
    await user.type(nameInput, "Test Group");

    expect(mockSetName).toHaveBeenCalled();
  });

  it("should call onSubmit on form submit", async () => {
    const user = userEvent.setup();
    render(
      <GroupForm
        form={makeForm({ name: "Test Group" })}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    const submitButton = screen.getByRole("button", { name: /create group/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <GroupForm
        form={makeForm({ name: "Test Group" })}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should disable submit button when name is empty", () => {
    render(
      <GroupForm
        form={makeForm({ name: "" })}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    const submitButton = screen.getByRole("button", { name: /create group/i });
    expect(submitButton).toBeDisabled();
  });

  it("should disable submit button when submitting", () => {
    render(
      <GroupForm
        form={makeForm({ name: "Test Group" })}
        submitting={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    const submitButton = screen.getByRole("button", { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });

  it("should show submitting text when submitting", () => {
    render(
      <GroupForm
        form={makeForm({ name: "Test Group" })}
        submitting={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });
});
