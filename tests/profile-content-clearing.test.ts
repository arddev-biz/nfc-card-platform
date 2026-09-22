import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

const mocks = vi.hoisted(() => ({
  getAdminApiUser: vi.fn(),
  profileFindUnique: vi.fn(),
  profileUpdate: vi.fn(),
  profileRenderer: vi.fn((_props: { business: { profile: { bio: string | null } } }) => null),
}));

vi.mock("@/lib/auth/session", () => ({ getAdminApiUser: mocks.getAdminApiUser }));
vi.mock("@/lib/db", () => ({
  db: {
    businessProfile: {
      findUnique: mocks.profileFindUnique,
      update: mocks.profileUpdate,
    },
  },
}));
vi.mock("@/components/profile/ProfileRenderer", () => ({
  ProfileRenderer: mocks.profileRenderer,
}));
vi.mock("@/components/admin/profile-builder/BlockStructureList", async () => {
  const ReactModule = await import("react");
  return {
    BlockStructureList: ({ onSelect }: { onSelect: (key: "BIO") => void }) =>
      ReactModule.createElement(
        "button",
        { type: "button", onClick: () => onSelect("BIO") },
        "Select Bio"
      ),
  };
});

import { PATCH } from "@/app/api/admin/businesses/[id]/profile-content/route";
import {
  buildProfileContentPayload,
  ProfileBuilderShell,
} from "@/components/admin/ProfileBuilderShell";
import { ProfileSettingsPanel } from "@/components/admin/profile-builder/ProfileSettingsPanel";
import { BioEditor } from "@/components/admin/profile-builder/BlockEditors";
import { ToastProvider } from "@/components/ui/Toast";

function requestFromBuilder(fields: Parameters<typeof buildProfileContentPayload>[0]) {
  return new NextRequest("http://localhost/api/admin/businesses/org-1/profile-content", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildProfileContentPayload(fields)),
  });
}

describe("Profile Builder Bio persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getAdminApiUser.mockResolvedValue({ id: "admin-1" });
    mocks.profileFindUnique.mockResolvedValue({ id: "profile-1", bio: "Old Bio" });
    mocks.profileUpdate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "profile-1", ...data })
    );
  });

  it("sends an explicit Bio clear through the API and service as Prisma null", async () => {
    const response = await PATCH(requestFromBuilder({ bio: "" }), {
      params: { id: "org-1" },
    });

    expect(response.status).toBe(200);
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
      data: { bio: null },
    });
    expect(await response.json()).toEqual({ profile: { id: "profile-1", bio: null } });
  });

  it("does not add Bio to a request that omitted it", async () => {
    await PATCH(requestFromBuilder({ address: "New address" }), {
      params: { id: "org-1" },
    });

    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
      data: { address: "New address" },
    });
  });

  it("clears legacy fallback fields through the existing API and Prisma service", async () => {
    const response = await PATCH(requestFromBuilder({ whatsapp: "", website: "" }), { params: { id: "org-1" } });
    expect(response.status).toBe(200);
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ where: { organizationId: "org-1" }, data: { whatsapp: null, website: null } });
  });

  it("submits the latest cleared Bio from the mounted Builder and keeps the preview empty", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      return PATCH(new NextRequest("http://localhost/api/admin/businesses/org-1/profile-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: String(init?.body),
      }), { params: { id: "org-1" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const business = {
      name: "Acme",
      businessType: null,
      profile: {
        displayName: "Acme",
        bio: "Test Bio",
        logoUrl: null,
        coverImageUrl: null,
        themeColor: null,
        backgroundType: "SOLID" as const,
        backgroundColor: null,
        backgroundGradient: null,
        backgroundImageUrl: null,
        backgroundMode: "LIGHT" as const,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        address: null,
        googleMapsUrl: null,
        links: [],
      },
    };
    const blocks = [
      {
        id: "bio-block",
        key: "BIO" as const,
        label: "Bio",
        description: "Business description",
        position: 0,
        isVisible: true,
        config: null,
        isAvailable: true,
      },
    ];

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          ToastProvider,
          null,
          React.createElement(ProfileBuilderShell, {
            organizationId: "org-1",
            businessSlug: "acme",
            business,
            initialBlocks: blocks,
            menuAvailable: false,
            isMenuEnabled: false,
            menu: null,
            adminPanel: React.createElement("div", null, "Admin"),
          })
        )
      );
    });

    const selectBio = renderer!.root
      .findAllByType("button")
      .find((button) => button.children.includes("Select Bio"));
    await act(async () => selectBio!.props.onClick());

    expect(renderer!.root.findAllByType(ProfileSettingsPanel)).toHaveLength(1);
    expect(renderer!.root.findAllByType(BioEditor)).toHaveLength(1);
    expect(renderer!.root.findAllByType("textarea")).toHaveLength(1);

    const originalEditor = renderer!.root.findByType(BioEditor);
    for (const label of ["Preview", "Edit"]) {
      await act(async () => {
        renderer!.root.findAllByType("button")
          .find((button) => button.children.includes(label))!.props.onClick();
      });
      expect(renderer!.root.findByType(BioEditor)).toBe(originalEditor);
      expect(renderer!.root.findAllByType(ProfileSettingsPanel)).toHaveLength(1);
    }

    const textarea = renderer!.root.findAllByType("textarea")[0];
    await act(async () => {
      textarea.props.onChange({ target: { value: "" } });
    });
    const saveButton = renderer!.root.findByType(BioEditor)
      .findAllByType("button")
      .find((button) => button.children.includes("Save"));
    const saveFromCurrentRender = saveButton!.props.onClick;

    await act(async () => {
      await saveFromCurrentRender();
    });

    expect(requestBody).toEqual({ bio: null });
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { organizationId: "org-1" }, data: { bio: null },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(renderer!.root.findAllByType("textarea").every((node) => node.props.value === ""))
      .toBe(true);
    const latestRendererProps = mocks.profileRenderer.mock.calls.at(-1)?.[0];
    expect(latestRendererProps?.business.profile.bio).toBeNull();
  });
});
