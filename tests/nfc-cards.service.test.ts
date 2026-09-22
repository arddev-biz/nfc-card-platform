import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  organizationFindUnique: vi.fn(),
  cardCreate: vi.fn(),
  cardFindFirst: vi.fn(),
  cardFindUnique: vi.fn(),
  cardUpdate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    organization: { findUnique: mocks.organizationFindUnique },
    nFCCard: {
      create: mocks.cardCreate,
      findFirst: mocks.cardFindFirst,
      findUnique: mocks.cardFindUnique,
      update: mocks.cardUpdate,
    },
  },
}));

import {
  CardNotFoundError,
  CardStatusConflictError,
  createCardForOrganization,
  getCardForRedirect,
  setCardStatus,
} from "@/lib/services/nfc-cards";

describe("NFC card service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.organizationFindUnique.mockResolvedValue({ id: "org-1" });
    mocks.cardCreate.mockImplementation(({ data }) => Promise.resolve({ id: "card", ...data }));
    mocks.cardUpdate.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, ...data })
    );
  });

  it("generates independent 192-bit hexadecimal tokens", async () => {
    const first = await createCardForOrganization("org-1");
    const second = await createCardForOrganization("org-1");

    expect(first.token).toMatch(/^[0-9a-f]{48}$/);
    expect(second.token).toMatch(/^[0-9a-f]{48}$/);
    expect(first.token).not.toBe(second.token);
  });

  it.each(["ACTIVE", "SUSPENDED", "REPLACED"] as const)(
    "returns %s status for the redirect resolver to enforce",
    async (status) => {
      mocks.cardFindUnique.mockResolvedValue({ status, organization: { slug: "acme" } });
      await expect(getCardForRedirect("token")).resolves.toEqual({
        status,
        organization: { slug: "acme" },
      });
    }
  );

  it("returns null for an unknown token", async () => {
    mocks.cardFindUnique.mockResolvedValue(null);
    await expect(getCardForRedirect("unknown")).resolves.toBeNull();
  });

  it("does not allow a replaced card to reactivate", async () => {
    mocks.cardFindFirst.mockResolvedValue({
      id: "card-1",
      organizationId: "org-1",
      status: "REPLACED",
      activatedAt: new Date(),
    });

    await expect(setCardStatus("org-1", "card-1", "ACTIVE")).rejects.toBeInstanceOf(
      CardStatusConflictError
    );
    expect(mocks.cardUpdate).not.toHaveBeenCalled();
  });

  it("rejects a card that is not owned by the organization", async () => {
    mocks.cardFindFirst.mockResolvedValue(null);
    await expect(setCardStatus("org-1", "foreign-card", "SUSPENDED")).rejects.toBeInstanceOf(
      CardNotFoundError
    );
  });
});
