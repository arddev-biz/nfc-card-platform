import { describe, expect, it } from "vitest";
import { buildProfileViewModel } from "@/lib/profileView";
import { computeAvailabilityFromViewModel } from "@/lib/blocks/availability";
import { SYSTEM_BLOCK_ORDER } from "@/lib/blocks/registry";

type Business = Parameters<typeof buildProfileViewModel>[0];
type Profile = Business["profile"];

function makeBusiness(overrides: Partial<Profile> = {}): Business {
  return {
    name: "Acme",
    businessType: "Services",
    profile: {
      displayName: "Acme",
      bio: null,
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
      ...overrides,
    },
  };
}

function link(type: Profile["links"][number]["type"], url: string, id = type) {
  return { id, type, label: type, url };
}

describe("profile view-model canonical sources", () => {
  it("prefers BusinessProfile.phone over a PHONE link", () => {
    const vm = buildProfileViewModel(
      makeBusiness({ phone: "+355 111111", links: [link("PHONE", "+355 222222")] })
    );
    expect(vm.callHref).toBe("tel:+355111111");
  });

  it("uses a PHONE link as the fallback", () => {
    expect(
      buildProfileViewModel(makeBusiness({ links: [link("PHONE", "+355 222222")] })).callHref
    ).toBe("tel:+355222222");
  });

  it("prefers a WHATSAPP link over BusinessProfile.whatsapp", () => {
    const vm = buildProfileViewModel(
      makeBusiness({ whatsapp: "+355 111111", links: [link("WHATSAPP", "+355 222222")] })
    );
    expect(vm.whatsappHref).toBe("https://wa.me/355222222");
  });

  it("uses BusinessProfile.whatsapp as the fallback", () => {
    expect(buildProfileViewModel(makeBusiness({ whatsapp: "+355 111111" })).whatsappHref).toBe(
      "https://wa.me/355111111"
    );
  });

  it("prefers a WEBSITE link and suppresses the legacy website row", () => {
    const vm = buildProfileViewModel(
      makeBusiness({ website: "https://legacy.example", links: [link("WEBSITE", "https://new.example")] })
    );
    expect(vm.secondaryLinks[0]?.url).toBe("https://new.example");
    expect(vm.businessInfoRows.some((row) => row.key === "website")).toBe(false);
  });

  it("uses BusinessProfile.website when there is no WEBSITE link", () => {
    const row = buildProfileViewModel(makeBusiness({ website: "https://legacy.example" }))
      .businessInfoRows.find((item) => item.key === "website");
    expect(row).toEqual({
      key: "website",
      label: "legacy.example",
      href: "https://legacy.example",
    });
  });

  it("prefers BusinessProfile.googleMapsUrl over a GOOGLE_MAPS link", () => {
    const vm = buildProfileViewModel(
      makeBusiness({
        googleMapsUrl: "https://maps.example/canonical",
        links: [link("GOOGLE_MAPS", "https://maps.example/fallback")],
      })
    );
    expect(vm.directionsHref).toBe("https://maps.example/canonical");
  });

  it("uses a GOOGLE_MAPS link as the fallback", () => {
    const vm = buildProfileViewModel(
      makeBusiness({ links: [link("GOOGLE_MAPS", "https://maps.example/fallback")] })
    );
    expect(vm.directionsHref).toBe("https://maps.example/fallback");
  });

  it("resolves Google Reviews only from GOOGLE_REVIEWS", () => {
    const vm = buildProfileViewModel(
      makeBusiness({ links: [link("GOOGLE_REVIEWS", "https://reviews.example/review")] })
    );
    expect(vm.reviewsHref).toBe("https://reviews.example/review");
  });
});

describe("shared block availability", () => {
  it("derives availability from the same view model used for rendering", () => {
    const business = makeBusiness({
      bio: "About us",
      phone: "+355 111111",
      address: "Main Street",
      links: [
        link("GOOGLE_REVIEWS", "https://reviews.example/review"),
        link("INSTAGRAM", "https://instagram.com/acme"),
      ],
    });
    const viewModel = buildProfileViewModel(business);

    expect(computeAvailabilityFromViewModel(business, viewModel, true)).toEqual({
      BIO: true,
      CONTACT: true,
      LOCATION: false,
      REVIEWS: true,
      MENU: true,
      LINKS: true,
      BUSINESS_INFO: true,
    });
  });

  it("marks contentless blocks unavailable", () => {
    const business = makeBusiness();
    const availability = computeAvailabilityFromViewModel(
      business,
      buildProfileViewModel(business),
      false
    );
    expect(Object.values(availability).every((value) => value === false)).toBe(true);
  });

  it("keeps exactly the seven supported system blocks", () => {
    expect(SYSTEM_BLOCK_ORDER).toEqual([
      "BIO",
      "CONTACT",
      "LOCATION",
      "REVIEWS",
      "MENU",
      "LINKS",
      "BUSINESS_INFO",
    ]);
  });
});
