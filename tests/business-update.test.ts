import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ find: vi.fn(), updateOrg: vi.fn(), updateProfile: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getAdminApiUser: async () => ({ id: "admin" }) }));
vi.mock("@/lib/db", () => ({ db: {
  organization: { findUnique: mocks.find }, $transaction: mocks.transaction,
} }));
import { PATCH } from "@/app/api/admin/businesses/[id]/route";

describe("existing Business Details PATCH compatibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.find.mockResolvedValue({ id: "org-1", slug: "acme" });
    mocks.updateOrg.mockResolvedValue({ id: "org-1", name: "Acme" });
    mocks.updateProfile.mockResolvedValue({ bio: null });
    mocks.transaction.mockImplementation((callback) => callback({
      organization: { update: mocks.updateOrg }, businessProfile: { update: mocks.updateProfile },
    }));
  });
  it.each(["bio", "phone", "email", "address", "googleMapsUrl", "themeColor"])(
    "persists an explicit empty %s as null through the real API and service", async (field) => {
      const response = await PATCH(new NextRequest("http://localhost/api/admin/businesses/org-1", {
        method: "PATCH", body: JSON.stringify({ businessName: "Acme", [field]: "" }),
      }), { params: { id: "org-1" } });
      expect(response.status).toBe(200);
      expect(mocks.updateProfile.mock.calls[0][0].data[field]).toBeNull();
    }
  );
  it("does not overwrite omitted Bio or display name when saving admin identity", async () => {
    await PATCH(new NextRequest("http://localhost/api/admin/businesses/org-1", {
      method: "PATCH", body: JSON.stringify({ businessName: "Acme", businessType: "" }),
    }), { params: { id: "org-1" } });
    expect(mocks.updateProfile.mock.calls[0][0].data.bio).toBeUndefined();
    expect(mocks.updateProfile.mock.calls[0][0].data.displayName).toBeUndefined();
    expect(mocks.updateOrg.mock.calls[0][0].data.businessType).toBeNull();
  });
});
