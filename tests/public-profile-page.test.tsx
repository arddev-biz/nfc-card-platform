import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicBusinessProfile: vi.fn(),
  isMenuAvailableForSlug: vi.fn(),
  getResolvedBlockLayoutForSlug: vi.fn(),
  buildProfileViewModel: vi.fn(),
  computeAvailabilityFromViewModel: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/services/public-profile", () => ({
  getPublicBusinessProfile: mocks.getPublicBusinessProfile,
}));
vi.mock("@/lib/services/public-menu", () => ({
  isMenuAvailableForSlug: mocks.isMenuAvailableForSlug,
}));
vi.mock("@/lib/services/profile-blocks", () => ({
  getResolvedBlockLayoutForSlug: mocks.getResolvedBlockLayoutForSlug,
}));
vi.mock("@/lib/profileView", () => ({ buildProfileViewModel: mocks.buildProfileViewModel }));
vi.mock("@/lib/blocks/availability", () => ({
  computeAvailabilityFromViewModel: mocks.computeAvailabilityFromViewModel,
}));

import PublicBusinessProfilePage from "@/app/[businessSlug]/page";

const business = { name: "Acme", profile: { displayName: "Acme" } };
const viewModel = { callHref: "tel:+355111111" };
const availability = { BIO: true };
const block = (id: string, isVisible: boolean, isAvailable: boolean, position: number) => ({
  id,
  key: "BIO",
  label: "Bio",
  description: "Bio",
  position,
  isVisible,
  isAvailable,
  config: null,
});

describe("public profile page block resolution", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getPublicBusinessProfile.mockResolvedValue(business);
    mocks.isMenuAvailableForSlug.mockResolvedValue(true);
    mocks.buildProfileViewModel.mockReturnValue(viewModel);
    mocks.computeAvailabilityFromViewModel.mockReturnValue(availability);
    mocks.notFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
  });

  it("excludes hidden and unavailable blocks while preserving saved order", async () => {
    mocks.getResolvedBlockLayoutForSlug.mockResolvedValue([
      block("visible-first", true, true, 4),
      block("hidden", false, true, 5),
      block("unavailable", true, false, 6),
      block("visible-second", true, true, 7),
    ]);

    const element = await PublicBusinessProfilePage({ params: { businessSlug: "acme" } });

    expect(element.props.blocks.map((item: { id: string }) => item.id)).toEqual([
      "visible-first",
      "visible-second",
    ]);
    expect(mocks.computeAvailabilityFromViewModel).toHaveBeenCalledWith(
      business,
      viewModel,
      true
    );
    expect(mocks.getResolvedBlockLayoutForSlug).toHaveBeenCalledWith("acme", availability);
  });

  it("returns not-found for a business that is not publicly available", async () => {
    mocks.getPublicBusinessProfile.mockResolvedValue(null);
    await expect(PublicBusinessProfilePage({ params: { businessSlug: "inactive" } })).rejects.toThrow(
      "NOT_FOUND"
    );
  });
});
