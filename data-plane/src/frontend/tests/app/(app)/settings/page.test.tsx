/**
 * Component tests for app/(app)/settings/page.tsx
 *
 * Server component: mocks getCompanyProfile and child shells.
 */

import { render, screen } from "@/tests/__utils__/test-utils";
import SettingsPage from "@/app/(app)/settings/page";

jest.mock("@/app/(app)/settings/actions/company-profile", () => ({
  getCompanyProfile: jest.fn().mockResolvedValue({
    companyName: "Test Co",
    subdomain: "test.app",
    mainContact: "admin@test.com",
    phoneNumber: "No phone number set",
  }),
}));

jest.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

jest.mock("@/components/settings/settings-header", () => ({
  SettingsHeader: () => <div data-testid="settings-header">Header</div>,
}));

jest.mock("@/components/settings/settings-overview", () => ({
  SettingsOverview: () => <div data-testid="settings-overview">Overview</div>,
}));

describe("SettingsPage", () => {
  it("should render shell, header, and overview", async () => {
    const page = await SettingsPage();
    render(page);

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-header")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overview")).toBeInTheDocument();
  });
});
