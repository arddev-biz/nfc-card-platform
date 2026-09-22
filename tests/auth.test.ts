import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  sessionFindUnique: vi.fn(),
  sessionDelete: vi.fn(),
  sessionCreate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: mocks.cookieGet,
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findUnique: mocks.sessionFindUnique,
      delete: mocks.sessionDelete,
      create: mocks.sessionCreate,
      deleteMany: mocks.sessionDeleteMany,
    },
  },
}));

import { getAdminApiUser, getSessionUser, requireAdminSession } from "@/lib/auth/session";

const superAdmin = {
  id: "user-1",
  email: "admin@example.com",
  passwordHash: "hash",
  role: "SUPER_ADMIN",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("session authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.sessionDelete.mockResolvedValue({});
    mocks.redirect.mockImplementation(() => {
      throw new Error("REDIRECT:/admin/login");
    });
  });

  it("rejects an unauthenticated request", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    await expect(getSessionUser()).resolves.toBeNull();
    expect(mocks.sessionFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid session token", async () => {
    mocks.cookieGet.mockReturnValue({ value: "invalid-token" });
    mocks.sessionFindUnique.mockResolvedValue(null);
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("rejects and removes an expired session", async () => {
    mocks.cookieGet.mockReturnValue({ value: "expired-token" });
    mocks.sessionFindUnique.mockResolvedValue({
      id: "session-1",
      expiresAt: new Date(Date.now() - 1_000),
      user: superAdmin,
    });

    await expect(getSessionUser()).resolves.toBeNull();
    expect(mocks.sessionDelete).toHaveBeenCalledWith({ where: { id: "session-1" } });
  });

  it("rejects a valid non-SUPER_ADMIN session", async () => {
    mocks.cookieGet.mockReturnValue({ value: "owner-token" });
    mocks.sessionFindUnique.mockResolvedValue({
      id: "session-1",
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...superAdmin, role: "BUSINESS_OWNER" },
    });

    await expect(getAdminApiUser()).resolves.toBeNull();
  });

  it("accepts a valid SUPER_ADMIN session", async () => {
    mocks.cookieGet.mockReturnValue({ value: "admin-token" });
    mocks.sessionFindUnique.mockResolvedValue({
      id: "session-1",
      expiresAt: new Date(Date.now() + 60_000),
      user: superAdmin,
    });

    await expect(getAdminApiUser()).resolves.toEqual(superAdmin);
  });

  it("redirects protected pages when authorization fails", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    await expect(requireAdminSession()).rejects.toThrow("REDIRECT:/admin/login");
  });
});
