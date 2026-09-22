import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ organizationFindFirst: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { organization: { findFirst: mocks.organizationFindFirst } },
}));

import { getPublicBusinessProfile } from "@/lib/services/public-profile";

const publicRow = {
  name: "Acme",
  businessType: "Services",
  profile: {
    displayName: "Acme",
    bio: "About",
    logoUrl: null,
    coverImageUrl: null,
    themeColor: null,
    backgroundType: "SOLID",
    backgroundColor: null,
    backgroundGradient: null,
    backgroundImageUrl: null,
    backgroundMode: "LIGHT",
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    address: null,
    googleMapsUrl: null,
    links: [],
  },
};

describe("public profile service", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads an active business", async () => {
    mocks.organizationFindFirst.mockResolvedValue(publicRow);
    await expect(getPublicBusinessProfile("acme")).resolves.toEqual(publicRow);
    expect(mocks.organizationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "acme", status: "ACTIVE" } })
    );
  });

  it("treats inactive, archived, and missing businesses as unavailable", async () => {
    mocks.organizationFindFirst.mockResolvedValue(null);
    await expect(getPublicBusinessProfile("not-public")).resolves.toBeNull();
  });

  it("selects public fields without internal ownership or subscription data", async () => {
    mocks.organizationFindFirst.mockResolvedValue(publicRow);
    const result = await getPublicBusinessProfile("acme");
    const query = mocks.organizationFindFirst.mock.calls[0][0];

    expect(query.select).not.toHaveProperty("ownerUserId");
    expect(query.select).not.toHaveProperty("subscriptions");
    expect(query.select.profile.select.links.select).toEqual({
      id: true,
      type: true,
      label: true,
      url: true,
    });
    expect(result).not.toHaveProperty("ownerUserId");
    expect(result).not.toHaveProperty("subscriptions");
  });
});
