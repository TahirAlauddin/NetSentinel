/**
 * Tests for app/not-found.tsx
 */

import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe("NotFound", () => {
  it("should render 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("should render page not found message", () => {
    render(<NotFound />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("should render description text", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/The page you're looking for doesn't exist or has been moved/)
    ).toBeInTheDocument();
  });

  it("should render back to dashboard link", () => {
    render(<NotFound />);
    const dashboardLink = screen.getByText("Back to Dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("should render go to settings link", () => {
    render(<NotFound />);
    const settingsLink = screen.getByText("Go to Settings");
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink.closest("a")).toHaveAttribute("href", "/settings");
  });

  it("should render help links", () => {
    render(<NotFound />);
    expect(screen.getByText(/Need help\?/)).toBeInTheDocument();
    expect(screen.getByText("documentation")).toBeInTheDocument();
    expect(screen.getByText("contact support")).toBeInTheDocument();
  });
});

