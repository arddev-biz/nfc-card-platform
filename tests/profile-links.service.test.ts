import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  profileFindUnique: vi.fn(),
  queryRaw: vi.fn(),
  linkFindFirst: vi.fn(),
  linkFindMany: vi.fn(),
  linkAggregate: vi.fn(),
  linkCreate: vi.fn(),
  linkUpdate: vi.fn(),
  transaction: vi.fn(),
}));

const tx = {
  businessProfile: { findUnique: mocks.profileFindUnique },
  profileLink: {
    findFirst: mocks.linkFindFirst,
    findMany: mocks.linkFindMany,
    aggregate: mocks.linkAggregate,
    create: mocks.linkCreate,
    update: mocks.linkUpdate,
  },
  $queryRaw: mocks.queryRaw,
};

vi.mock("@/lib/db", () => ({
  db: {
    businessProfile: { findUnique: mocks.profileFindUnique },
    profileLink: {
      findFirst: mocks.linkFindFirst,
      findMany: mocks.linkFindMany,
      aggregate: mocks.linkAggregate,
      create: mocks.linkCreate,
      update: mocks.linkUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

import {
  createProfileLink,
  ProfileLinkConflictError,
  ProfileLinkNotFoundError,
  reorderProfileLinks,
  setProfileLinkActive,
  updateProfileLink,
} from "@/lib/services/profile-links";

describe("profile link service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.profileFindUnique.mockResolvedValue({ id: "profile-1" });
    mocks.queryRaw.mockResolvedValue([{ id: "profile-1" }]);
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    mocks.linkAggregate.mockResolvedValue({ _max: { sortOrder: 3 } });
    mocks.linkCreate.mockImplementation(({ data }) => Promise.resolve({ id: "new-link", ...data }));
    mocks.linkUpdate.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, ...data })
    );
  });

  it("rejects a duplicate promoted singleton link", async () => {
    mocks.linkFindFirst.mockResolvedValue({ id: "existing-review" });

    await expect(
      createProfileLink("org-1", {
        type: "GOOGLE_REVIEWS",
        value: "https://reviews.example/review",
        isActive: true,
      })
    ).rejects.toBeInstanceOf(ProfileLinkConflictError);
    expect(mocks.linkCreate).not.toHaveBeenCalled();
  });

  it("preserves the requested active state when creating a regular link", async () => {
    const created = await createProfileLink("org-1", {
      type: "CUSTOM",
      value: "https://example.com",
      isActive: false,
    });

    expect(created).toEqual(expect.objectContaining({ isActive: false, sortOrder: 4 }));
  });

  it("rejects an update for a foreign or unowned link", async () => {
    mocks.linkFindFirst.mockResolvedValue(null);

    await expect(
      updateProfileLink("org-1", "foreign-link", {
        type: "CUSTOM",
        value: "https://example.com",
      })
    ).rejects.toBeInstanceOf(ProfileLinkNotFoundError);
  });

  it("rejects activation when another promoted link of that type is active", async () => {
    mocks.linkFindFirst
      .mockResolvedValueOnce({
        id: "review-2",
        businessProfileId: "profile-1",
        type: "GOOGLE_REVIEWS",
        isActive: false,
      })
      .mockResolvedValueOnce({ id: "review-1" });

    await expect(setProfileLinkActive("org-1", "review-2", true)).rejects.toBeInstanceOf(
      ProfileLinkConflictError
    );
  });

  it("allows an owned link to be deactivated", async () => {
    mocks.linkFindFirst.mockResolvedValue({
      id: "link-1",
      businessProfileId: "profile-1",
      type: "CUSTOM",
      isActive: true,
    });

    await setProfileLinkActive("org-1", "link-1", false);
    expect(mocks.linkUpdate).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { isActive: false },
    });
  });

  it("reorders the exact active subset while preserving inactive slots", async () => {
    const existing = [
      { id: "active-a", isActive: true },
      { id: "inactive", isActive: false },
      { id: "active-b", isActive: true },
    ];
    mocks.linkFindMany.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

    await reorderProfileLinks("org-1", ["active-b", "active-a"]);

    expect(mocks.linkUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "active-b" },
      data: { sortOrder: 0 },
    });
    expect(mocks.linkUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "inactive" },
      data: { sortOrder: 1 },
    });
    expect(mocks.linkUpdate).toHaveBeenNthCalledWith(3, {
      where: { id: "active-a" },
      data: { sortOrder: 2 },
    });
  });

  it("accepts a valid full reorder", async () => {
    const existing = [
      { id: "a", isActive: true },
      { id: "b", isActive: false },
    ];
    mocks.linkFindMany.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);
    await expect(reorderProfileLinks("org-1", ["b", "a"])).resolves.toBe(existing);
  });

  it("rejects an arbitrary or foreign reorder subset", async () => {
    mocks.linkFindMany.mockResolvedValue([
      { id: "a", isActive: true },
      { id: "b", isActive: true },
    ]);
    await expect(reorderProfileLinks("org-1", ["a", "foreign"])).rejects.toBeInstanceOf(
      ProfileLinkNotFoundError
    );
  });
});
