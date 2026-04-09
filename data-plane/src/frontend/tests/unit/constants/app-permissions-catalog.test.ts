import { getCatalogAccessTier } from "@/constants/app-permissions-catalog";

describe("getCatalogAccessTier", () => {
  it('returns "admin" for frontendApp "all" (no stems)', () => {
    expect(getCatalogAccessTier("view_asset", "all")).toBe("admin");
  });

  it('classifies assets view_* as read', () => {
    expect(getCatalogAccessTier("view_asset", "assets")).toBe("read");
    expect(getCatalogAccessTier("VIEW_ASSET", "assets")).toBe("read");
  });

  it('classifies assets change_* as edit', () => {
    expect(getCatalogAccessTier("change_vendor", "assets")).toBe("edit");
  });

  it('classifies add_* and delete_* as admin', () => {
    expect(getCatalogAccessTier("add_asset", "assets")).toBe("admin");
    expect(getCatalogAccessTier("delete_asset", "assets")).toBe("admin");
  });

  it('returns admin for codenames not matching catalog stems', () => {
    expect(getCatalogAccessTier("view_randomthing", "assets")).toBe("admin");
  });

  it("works for ipam stems", () => {
    expect(getCatalogAccessTier("view_subnet", "ipam")).toBe("read");
    expect(getCatalogAccessTier("change_subnet", "ipam")).toBe("edit");
  });
});
