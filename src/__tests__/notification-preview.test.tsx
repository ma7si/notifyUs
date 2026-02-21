/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NotificationPreview } from "@/components/notifications/NotificationPreview";

const baseProps = {
  type: "banner" as const,
  position: "top" as const,
  title: "Test Title",
  body: "Test body",
  ctaText: "Click me",
  ctaUrl: "https://example.com",
  imageUrl: null,
  backgroundColor: "#1a1a2e",
  textColor: "#ffffff",
  ctaColor: "#e94560",
  isDismissable: true,
  lang: "en",
};

describe("NotificationPreview", () => {
  test("renders banner with title and body", () => {
    render(<NotificationPreview {...baseProps} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("renders modal type", () => {
    render(
      <NotificationPreview {...baseProps} type="modal" position="center" />
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  test("renders toast type", () => {
    render(<NotificationPreview {...baseProps} type="toast" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  test("applies RTL direction for Arabic lang", () => {
    const { container } = render(
      <NotificationPreview {...baseProps} lang="ar" />
    );
    const banner = container.querySelector("[dir='rtl']");
    expect(banner).toBeInTheDocument();
  });

  test("shows dismiss button when isDismissable", () => {
    const { container } = render(
      <NotificationPreview {...baseProps} isDismissable={true} />
    );
    const dismissBtn = container.querySelector("button");
    expect(dismissBtn).toBeInTheDocument();
  });

  test("hides CTA when ctaText is null", () => {
    render(<NotificationPreview {...baseProps} ctaText={null} />);
    expect(screen.queryByText("Click me")).not.toBeInTheDocument();
  });
});
