import { getLayoutRequiredPermission } from "@/lib/layout-required-permissions";

describe("getLayoutRequiredPermission", () => {
  describe("assets", () => {
    it("uses layout rules for new/edit before base route map", () => {
      expect(getLayoutRequiredPermission("assets", "/assets/new")).toBe("assets.add_asset");
      expect(getLayoutRequiredPermission("assets", "/assets/edit/5")).toBe("assets.change_asset");
    });

    it("falls back to route map for list routes", () => {
      expect(getLayoutRequiredPermission("assets", "/assets/list")).toBe("assets.view_asset");
    });
  });

  describe("ipam", () => {
    it("requires add/change for CRUD subpaths", () => {
      expect(getLayoutRequiredPermission("ipam", "/ipam/subnets/new")).toBe("ipam.add_subnet");
      expect(getLayoutRequiredPermission("ipam", "/ipam/subnets/edit/3")).toBe("ipam.change_subnet");
    });

    it("falls back to prefix permission for read-only pages", () => {
      expect(getLayoutRequiredPermission("ipam", "/ipam/subnets")).toBe("ipam.view_subnet");
    });
  });

  describe("contracts", () => {
    it("maps new/edit", () => {
      expect(getLayoutRequiredPermission("contracts", "/contracts/new")).toBe("contracts.add_contract");
      expect(getLayoutRequiredPermission("contracts", "/contracts/edit/1")).toBe(
        "contracts.change_contract"
      );
    });
  });

  describe("telecom-management", () => {
    it("maps provider create", () => {
      expect(
        getLayoutRequiredPermission("telecom-management", "/telecom-management/providers/new")
      ).toBe("telecom.add_provider");
    });
  });

  describe("notifications", () => {
    it("has no extra layout rules; uses route map", () => {
      expect(getLayoutRequiredPermission("notifications", "/notifications")).toBe(
        "notifications.view_inappnotification"
      );
    });
  });

  describe("monitoring", () => {
    it("maps host add and edit", () => {
      expect(getLayoutRequiredPermission("monitoring", "/monitoring/hosts/add")).toBe(
        "monitoring.add_host"
      );
      expect(getLayoutRequiredPermission("monitoring", "/monitoring/hosts/5/edit")).toBe(
        "monitoring.change_host"
      );
    });

    it("falls back to route map for list routes", () => {
      expect(getLayoutRequiredPermission("monitoring", "/monitoring/hosts")).toBe(
        "monitoring.view_host"
      );
    });
  });
});
