import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { ProfileBuilderShell } from "@/components/admin/ProfileBuilderShell";
import { BusinessAdminForm } from "@/components/admin/BusinessAdminForm";
import { NfcCardsManager } from "@/components/admin/NfcCardsManager";
import { BusinessStatusActions } from "@/components/admin/BusinessStatusActions";

function elements(node: React.ReactNode): React.ReactElement[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return [];
  return [node, ...elements(node.props.children)];
}

const mocks = vi.hoisted(() => ({
  getOrganizationById: vi.fn(),
  listOrganizations: vi.fn(),
  getBuilderProfileData: vi.fn(),
  getResolvedBlockLayout: vi.fn(),
  listProfileLinks: vi.fn(),
  listCardsForOrganization: vi.fn(),
  isMenuAvailableForOrganization: vi.fn(),
  getMenuForOrganization: vi.fn(),
  buildProfileViewModel: vi.fn(),
  computeAvailabilityFromViewModel: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));
vi.mock("@/lib/services/organizations", () => ({
  getOrganizationById: mocks.getOrganizationById,
  listOrganizations: mocks.listOrganizations,
}));
vi.mock("@/lib/services/profile-blocks", () => ({
  getBuilderProfileData: mocks.getBuilderProfileData,
  getResolvedBlockLayout: mocks.getResolvedBlockLayout,
}));
vi.mock("@/lib/services/profile-links", () => ({ listProfileLinks: mocks.listProfileLinks }));
vi.mock("@/lib/services/nfc-cards", () => ({
  listCardsForOrganization: mocks.listCardsForOrganization,
}));
vi.mock("@/lib/services/public-menu", () => ({
  isMenuAvailableForOrganization: mocks.isMenuAvailableForOrganization,
}));
vi.mock("@/lib/services/menus", () => ({ getMenuForOrganization: mocks.getMenuForOrganization }));
vi.mock("@/lib/profileView", () => ({ buildProfileViewModel: mocks.buildProfileViewModel }));
vi.mock("@/lib/blocks/availability", () => ({
  computeAvailabilityFromViewModel: mocks.computeAvailabilityFromViewModel,
}));

import BusinessEditorPage from "@/app/admin/(protected)/businesses/[id]/page";
import LegacyProfileBuilderPage from "@/app/admin/(protected)/businesses/[id]/builder/page";

describe("canonical Business Editor routing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getOrganizationById.mockResolvedValue({
      id: "org-1",
      name: "Acme",
      slug: "acme",
      businessType: null,
      status: "ACTIVE",
      profile: {},
      subscriptions: [],
    });
    mocks.listOrganizations.mockResolvedValue([]);
    mocks.getBuilderProfileData.mockResolvedValue({ name: "Acme", profile: {} });
    mocks.listProfileLinks.mockResolvedValue([]);
    mocks.listCardsForOrganization.mockResolvedValue([]);
    mocks.isMenuAvailableForOrganization.mockResolvedValue(false);
    mocks.getMenuForOrganization.mockResolvedValue({ isEnabled: false, menu: null });
    mocks.buildProfileViewModel.mockReturnValue({ secondaryLinks: [] });
    mocks.computeAvailabilityFromViewModel.mockReturnValue({ BIO: false });
    mocks.getResolvedBlockLayout.mockResolvedValue([]);
  });

  it("uses the shared profile pipeline on the canonical business route", async () => {
    const element = await BusinessEditorPage({ params: { id: "org-1" }, searchParams: {} });

    expect(element).toBeTruthy();
    expect(mocks.buildProfileViewModel).toHaveBeenCalledWith({ name: "Acme", profile: {} });
    expect(mocks.computeAvailabilityFromViewModel).toHaveBeenCalledWith(
      { name: "Acme", profile: {} },
      { secondaryLinks: [] },
      false
    );
    expect(mocks.getResolvedBlockLayout).toHaveBeenCalledWith("org-1", { BIO: false });
    expect(mocks.listProfileLinks).toHaveBeenCalledWith("org-1");
  });

  it("redirects the legacy builder route to the canonical editor", () => {
    LegacyProfileBuilderPage({ params: { id: "org-1" } });
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/businesses/org-1");
  });

  it("passes existing admin managers and subscription information into the unified workspace", async () => {
    const page = await BusinessEditorPage({ params: { id: "org-1" }, searchParams: {} });
    const shell = elements(page).find((element) => element.type === ProfileBuilderShell)!;
    const admin = elements(shell.props.adminPanel);
    expect(admin.some((element) => element.type === BusinessAdminForm)).toBe(true);
    expect(admin.some((element) => element.type === NfcCardsManager)).toBe(true);
    expect(admin.some((element) => element.type === BusinessStatusActions)).toBe(true);
    expect(admin.some((element) => element.props.children === "Service / Subscription")).toBe(true);
    expect(elements(page).some((element) => element.props.href === "/admin/businesses")).toBe(true);
  });
});
