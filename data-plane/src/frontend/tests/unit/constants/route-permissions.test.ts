import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

describe("getRequiredPermissionForPathname", () => {
  it("returns undefined for routes with no mapping", () => {
    expect(getRequiredPermissionForPathname("/dashboard")).toBeUndefined();
    expect(getRequiredPermissionForPathname("/unknown/deep/path")).toBeUndefined();
  });

  it("matches exact entries", () => {
    expect(getRequiredPermissionForPathname("/assets")).toBe("assets.view_asset");
    expect(getRequiredPermissionForPathname("/contracts")).toBe("contracts.view_contract");
    expect(getRequiredPermissionForPathname("/settings/groups")).toBe("users.view_group");
  });

  it("normalizes trailing slashes", () => {
    expect(getRequiredPermissionForPathname("/assets/")).toBe("assets.view_asset");
  });

  it("uses longest prefix for nested paths", () => {
    expect(getRequiredPermissionForPathname("/ipam/subnets/42")).toBe("ipam.view_subnet");
    expect(getRequiredPermissionForPathname("/assets/reporting/operating-system")).toBe(
      "assets.view_asset"
    );
  });
});
