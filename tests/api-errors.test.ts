import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  class OrganizationNotFoundError extends Error {}
  class ProfileLinkConflictError extends Error {}
  return {
    getAdminApiUser: vi.fn(),
    createProfileLink: vi.fn(),
    listProfileLinks: vi.fn(),
    OrganizationNotFoundError,
    ProfileLinkConflictError,
  };
});

vi.mock("@/lib/auth/session", () => ({ getAdminApiUser: mocks.getAdminApiUser }));
vi.mock("@/lib/services/profile-links", () => ({
  createProfileLink: mocks.createProfileLink,
  listProfileLinks: mocks.listProfileLinks,
  OrganizationNotFoundError: mocks.OrganizationNotFoundError,
  ProfileLinkConflictError: mocks.ProfileLinkConflictError,
}));

import { POST } from "@/app/api/admin/businesses/[id]/links/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/admin/businesses/org-1/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("representative API error semantics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getAdminApiUser.mockResolvedValue({ id: "admin" });
  });

  it("returns 401 when the admin request is unauthenticated or unauthorized", async () => {
    mocks.getAdminApiUser.mockResolvedValue(null);
    const response = await POST(request({ type: "CUSTOM", value: "https://example.com" }), {
      params: { id: "org-1" },
    });
    expect(response.status).toBe(401);
    expect(mocks.createProfileLink).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid input", async () => {
    const response = await POST(request({ type: "CUSTOM", value: "javascript:alert(1)" }), {
      params: { id: "org-1" },
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({ fieldErrors: expect.any(Object) }));
  });

  it("returns 404 for a missing scoped resource", async () => {
    mocks.createProfileLink.mockRejectedValue(new mocks.OrganizationNotFoundError("missing"));
    const response = await POST(request({ type: "CUSTOM", value: "https://example.com" }), {
      params: { id: "missing-org" },
    });
    expect(response.status).toBe(404);
  });

  it("returns 409 for a promoted-link conflict", async () => {
    mocks.createProfileLink.mockRejectedValue(new mocks.ProfileLinkConflictError("duplicate"));
    const response = await POST(
      request({ type: "GOOGLE_REVIEWS", value: "https://reviews.example/review" }),
      { params: { id: "org-1" } }
    );
    expect(response.status).toBe(409);
  });

  it("returns 201 for a valid authorized create", async () => {
    mocks.createProfileLink.mockResolvedValue({ id: "link-1" });
    const response = await POST(request({ type: "CUSTOM", value: "https://example.com" }), {
      params: { id: "org-1" },
    });
    expect(response.status).toBe(201);
  });
});
