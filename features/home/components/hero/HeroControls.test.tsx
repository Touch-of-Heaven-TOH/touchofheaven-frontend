import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { heroMediaItems } from "@/features/home/config/hero-media";
import { HeroControls } from "@/features/home/components/hero/HeroControls";

describe("HeroControls", () => {
  it("exposes named controls and selected slide state", () => {
    render(
      <HeroControls
        activeIndex={1}
        isPaused={false}
        items={heroMediaItems}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onSelect={vi.fn()}
        onTogglePause={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Previous hero slide" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Pause hero carousel" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next hero slide" })).toBeVisible();
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
  });
});
