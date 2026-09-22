import { describe, expect, it } from "vitest";
import { profileContentUpdateSchema } from "@/lib/validation/profile-content";
import {
  profileLinkInputSchema,
  reorderLinksSchema,
  setActiveSchema,
} from "@/lib/validation/profile-links";
import { blockReorderSchema, blockVisibilitySchema } from "@/lib/validation/profile-blocks";
import { businessAdminUpdateSchema } from "@/lib/validation/business";

describe("profile content validation", () => {
  it.each([
    "bio",
    "phone",
    "email",
    "address",
    "googleMapsUrl",
    "themeColor",
  ] as const)("treats an empty %s as an explicit clear", (field) => {
    expect(profileContentUpdateSchema.parse({ [field]: "   " })[field]).toBeNull();
  });

  it("distinguishes an omitted field from an explicit clear", () => {
    const omitted = profileContentUpdateSchema.parse({ bio: "kept" });
    const cleared = profileContentUpdateSchema.parse({ bio: "" });

    expect(omitted).not.toHaveProperty("phone");
    expect(cleared.bio).toBeNull();
  });

  it("does not allow the required display name to be cleared", () => {
    expect(profileContentUpdateSchema.safeParse({ displayName: "" }).success).toBe(false);
  });
});

describe("business admin validation", () => {
  it("clears nullable business type without accepting profile fields", () => {
    const parsed = businessAdminUpdateSchema.parse({
      businessName: "Acme",
      slug: "acme",
      businessType: "",
      bio: "must not be handled by the admin form",
    });

    expect(parsed.businessType).toBeNull();
    expect(parsed).not.toHaveProperty("bio");
  });
});

describe("profile link validation", () => {
  const link = (value: string) => profileLinkInputSchema.safeParse({ type: "CUSTOM", value });

  it("accepts an HTTP URL", () => expect(link("http://example.com").success).toBe(true));
  it("accepts an HTTPS URL", () => expect(link("https://example.com/path").success).toBe(true));
  it("rejects javascript URLs", () => expect(link("javascript:alert(1)").success).toBe(false));
  it("rejects FTP URLs", () => expect(link("ftp://example.com").success).toBe(false));
  it("rejects malformed URLs", () => expect(link("not a url").success).toBe(false));
  it("rejects URLs without a hostname", () => expect(link("https://").success).toBe(false));

  it("validates active-state and reorder payload shapes", () => {
    expect(setActiveSchema.safeParse({ isActive: false }).success).toBe(true);
    expect(setActiveSchema.safeParse({ isActive: "false" }).success).toBe(false);
    expect(reorderLinksSchema.safeParse({ orderedIds: [] }).success).toBe(false);
  });
});

describe("profile block request validation", () => {
  it("accepts a boolean visibility value and rejects non-booleans", () => {
    expect(blockVisibilitySchema.safeParse({ isVisible: true }).success).toBe(true);
    expect(blockVisibilitySchema.safeParse({ isVisible: "true" }).success).toBe(false);
  });

  it("requires at least one non-empty reorder id", () => {
    expect(blockReorderSchema.safeParse({ orderedIds: ["block-1"] }).success).toBe(true);
    expect(blockReorderSchema.safeParse({ orderedIds: [] }).success).toBe(false);
    expect(blockReorderSchema.safeParse({ orderedIds: [""] }).success).toBe(false);
  });
});
