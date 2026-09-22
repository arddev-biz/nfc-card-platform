import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCardForRedirect: vi.fn(),
  getPublicBusinessProfile: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/services/nfc-cards", () => ({
  getCardForRedirect: mocks.getCardForRedirect,
}));
vi.mock("@/lib/services/public-profile", () => ({
  getPublicBusinessProfile: mocks.getPublicBusinessProfile,
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

import NfcCardRedirectPage from "@/app/c/[cardToken]/page";

describe("NFC redirect page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.notFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
  });

  it("redirects a valid active card to its active public profile", async () => {
    mocks.getCardForRedirect.mockResolvedValue({
      status: "ACTIVE",
      organization: { slug: "acme" },
    });
    mocks.getPublicBusinessProfile.mockResolvedValue({ name: "Acme" });

    await expect(NfcCardRedirectPage({ params: { cardToken: "token" } })).rejects.toThrow(
      "REDIRECT:/acme"
    );
  });

  it.each(["SUSPENDED", "REPLACED"] as const)(
    "does not redirect a %s card",
    async (status) => {
      mocks.getCardForRedirect.mockResolvedValue({ status, organization: { slug: "acme" } });
      const element = await NfcCardRedirectPage({ params: { cardToken: "token" } });
      expect(element).toBeTruthy();
      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(mocks.getPublicBusinessProfile).not.toHaveBeenCalled();
    }
  );

  it("fails safely for an unknown token", async () => {
    mocks.getCardForRedirect.mockResolvedValue(null);
    await expect(NfcCardRedirectPage({ params: { cardToken: "unknown" } })).rejects.toThrow(
      "NOT_FOUND"
    );
  });
});
