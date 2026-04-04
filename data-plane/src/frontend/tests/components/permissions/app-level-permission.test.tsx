import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/tests/__utils__/test-utils";
import AppLevelPermission from "@/components/permissions/AppLevelPermission";
import { buildEmptyAppAccess } from "@/constants/permissions-by-app";

describe("AppLevelPermission", () => {
  it("calls onChange when a level is selected", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const value = buildEmptyAppAccess();

    render(<AppLevelPermission value={value} onChange={onChange} />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);

    await user.selectOptions(selects[0], "read");

    expect(onChange).toHaveBeenCalled();
    const firstCall = onChange.mock.calls[0][0];
    expect(firstCall.assets).toBe("read");
  });

  it("respects disabled state", () => {
    const onChange = jest.fn();
    const value = buildEmptyAppAccess();

    render(<AppLevelPermission value={value} onChange={onChange} disabled />);

    const selects = screen.getAllByRole("combobox");
    expect(selects[0]).toBeDisabled();
  });
});
