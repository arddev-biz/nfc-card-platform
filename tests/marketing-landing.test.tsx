import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TestRenderer, { act } from "react-test-renderer";
import LandingPage from "@/app/page";
import { LandingNavbar } from "@/components/marketing/landing/LandingNavbar";
import { ProfileShowcase } from "@/components/marketing/landing/Sections";

afterEach(() => vi.unstubAllEnvs());

it("provides valid landing anchors, working conversion routes and clearly labelled demos", () => {
  const html = renderToStaticMarkup(<LandingPage />);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) expect(ids.has(match[1])).toBe(true);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toContain('href="/get-started"');
  expect(html).toContain('href="/admin/login"');
  expect(html).toContain("Illustrative demo profiles, not customer endorsements.");
  expect(html).not.toContain("€");
  expect(html).not.toContain('href="#"');
  expect(html.match(/<details>/g)).toHaveLength(7);
});

it("preserves the configured live example and omits the link when it is unavailable", () => {
  vi.stubEnv("NEXT_PUBLIC_DEMO_BUSINESS_SLUG", "demo-cafe");
  expect(renderToStaticMarkup(<ProfileShowcase />)).toContain('href="/demo-cafe"');
  vi.stubEnv("NEXT_PUBLIC_DEMO_BUSINESS_SLUG", "");
  expect(renderToStaticMarkup(<ProfileShowcase />)).not.toContain("Explore a live profile");
});

it("mobile navigation exposes its state, closes on selection and supports Escape", () => {
  let tree!: TestRenderer.ReactTestRenderer;
  const focus = vi.fn();
  act(() => { tree = TestRenderer.create(<LandingNavbar />, { createNodeMock: node => node.type === "button" ? { focus } : null }); });
  const button = () => tree.root.findByType("button");
  try {
    expect(button().props["aria-expanded"]).toBe(false);
    act(() => button().props.onClick());
    expect(button().props["aria-expanded"]).toBe(true);
    const mobile = tree.root.findByProps({ id: "landing-mobile-navigation" });
    expect(mobile.props.hidden).toBe(false);
    act(() => mobile.findAllByType("a")[0].props.onClick());
    expect(button().props["aria-expanded"]).toBe(false);
    act(() => button().props.onClick());
    act(() => tree.root.findByType("header").props.onKeyDown({ key: "Escape" }));
    expect(button().props["aria-expanded"]).toBe(false);
    expect(focus).toHaveBeenCalledOnce();
  } finally { act(() => tree.unmount()); }
});
