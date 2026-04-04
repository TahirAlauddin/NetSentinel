/**
 * One representative path per product area — documents expected RBAC keys for smoke coverage.
 * Detailed prefix rules are covered in unit tests for route-permissions + layout-required-permissions.
 */

import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

describe("Per-app route permission surface (getRequiredPermissionForPathname)", () => {
  const cases: [string, string][] = [
    ["/assets", "assets.view_asset"],
    ["/contracts", "contracts.view_contract"],
    ["/telecom-management", "telecom.view_provider"],
    ["/notifications", "notifications.view_inappnotification"],
    ["/phone-management", "phone_management.view_managedphonenumber"],
    ["/ipam", "ipam.view_subnet"],
    ["/settings/people", "users.view_user"],
  ];

  it.each(cases)("path %s requires %s", (path, expected) => {
    expect(getRequiredPermissionForPathname(path)).toBe(expected);
  });
});
