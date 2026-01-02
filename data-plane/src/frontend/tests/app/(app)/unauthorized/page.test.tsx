/**
 * Tests for app/(app)/unauthorized/page.tsx
 */

import { render, screen } from "@testing-library/react";
import UnauthorizedPage from "@/app/(app)/unauthorized/page";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "Link";
  return MockLink;
});

describe("UnauthorizedPage", () => {
  it("should render 403 heading", () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText("403")).toBeInTheDocument();
  });

  it("should render unauthorized message", () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });

  it("should render permission denied message", () => {
    render(<UnauthorizedPage />);
    expect(
      screen.getByText(/You don't have permission to access this resource/)
    ).toBeInTheDocument();
  });

  it("should render dashboard link", () => {
    render(<UnauthorizedPage />);
    const dashboardLink = screen.getByText("Go to Dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest("a")).toHaveAttribute("href", "/dashboard");
  });
});



