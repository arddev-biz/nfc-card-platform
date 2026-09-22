import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  leadFindUnique: vi.fn(),
  leadUpdateMany: vi.fn(),
  leadUpdate: vi.fn(),
  transaction: vi.fn(),
  createOrganization: vi.fn(),
}));

const tx = {
  lead: {
    findUnique: mocks.leadFindUnique,
    updateMany: mocks.leadUpdateMany,
    update: mocks.leadUpdate,
  },
};

vi.mock("@/lib/db", () => ({
  db: {
    lead: {
      findUnique: mocks.leadFindUnique,
      updateMany: mocks.leadUpdateMany,
      update: mocks.leadUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/services/organizations", () => ({
  createOrganizationInTransaction: mocks.createOrganization,
}));

import {
  convertLeadToOrganization,
  LeadAlreadyConvertedError,
} from "@/lib/services/leads";

const lead = {
  id: "lead-1",
  businessName: "Acme",
  businessType: "Services",
  phone: "+355 111111",
  email: "owner@example.com",
};

describe("atomic lead conversion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    mocks.leadFindUnique.mockResolvedValue(lead);
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 });
    mocks.createOrganization.mockResolvedValue({ organization: { id: "org-1" } });
    mocks.leadUpdate.mockResolvedValue({
      ...lead,
      status: "CONVERTED",
      convertedOrganizationId: "org-1",
    });
  });

  it("creates and links the organization inside one transaction", async () => {
    const result = await convertLeadToOrganization("lead-1");

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createOrganization).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ businessName: "Acme", phone: "+355 111111" })
    );
    expect(mocks.leadUpdate).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: { convertedOrganizationId: "org-1" },
    });
    expect(result.organization.id).toBe("org-1");
  });

  it("returns a conflict when the lead cannot be claimed", async () => {
    mocks.leadUpdateMany.mockResolvedValue({ count: 0 });

    await expect(convertLeadToOrganization("lead-1")).rejects.toBeInstanceOf(
      LeadAlreadyConvertedError
    );
    expect(mocks.createOrganization).not.toHaveBeenCalled();
  });

  it("does not link the lead when organization creation fails", async () => {
    mocks.createOrganization.mockRejectedValue(new Error("profile insert failed"));

    await expect(convertLeadToOrganization("lead-1")).rejects.toThrow("profile insert failed");
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
  });

  it("allows only one of two concurrent claims to create an organization", async () => {
    mocks.leadUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const results = await Promise.allSettled([
      convertLeadToOrganization("lead-1"),
      convertLeadToOrganization("lead-1"),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(mocks.createOrganization).toHaveBeenCalledTimes(1);
  });
});
