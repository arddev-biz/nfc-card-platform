import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TestRenderer, { act } from "react-test-renderer";
import { ProfileBuilderShell } from "@/components/admin/ProfileBuilderShell";
import { BusinessAdminForm } from "@/components/admin/BusinessAdminForm";
import { ProfileSettingsPanel } from "@/components/admin/profile-builder/ProfileSettingsPanel";
import { BioEditor, ContactEditor, HeaderEditor } from "@/components/admin/profile-builder/BlockEditors";
import { DesignPanel } from "@/components/admin/profile-builder/DesignPanel";
import { LinksEditor } from "@/components/admin/profile-builder/LinksEditor";
import { ProfileLinkForm } from "@/components/admin/ProfileLinkForm";
import { MenuEditor } from "@/components/admin/profile-builder/MenuEditor";
import { MenuManager } from "@/components/admin/MenuManager";
import { BlockStructureList } from "@/components/admin/profile-builder/BlockStructureList";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";
import { ToastProvider } from "@/components/ui/Toast";
import { LINK_TYPE_ORDER } from "@/lib/linkTypes";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/profile/ProfileRenderer", () => ({ ProfileRenderer: () => null }));
vi.mock("@/components/admin/profile-builder/BlockStructureList", () => ({ BlockStructureList: () => null }));

const business = {
  name: "Test business", businessType: null,
  profile: {
    displayName: "Test", bio: "Original", phone: null, email: null,
    whatsapp: "+355691234567", website: "https://legacy.example", address: null, googleMapsUrl: null,
    logoUrl: null, coverImageUrl: null, backgroundImageUrl: null, themeColor: null,
    backgroundType: "SOLID" as const, backgroundColor: null, backgroundGradient: null,
    backgroundMode: "LIGHT" as const, links: [],
  },
};
const blocks = ["BIO", "LINKS"].map((key, position) => ({
  id: `row-${position}`, key: key as "BIO" | "LINKS", label: key, description: "", position,
  config: null, isVisible: true, isAvailable: true,
}));
let renderer: TestRenderer.ReactTestRenderer;
const fetchMock = vi.fn();
async function mount() {
  await act(async () => {
    renderer = TestRenderer.create(<ToastProvider><ProfileBuilderShell
      organizationId="org-1" businessSlug="test" business={business} initialBlocks={blocks}
      menuAvailable={false} isMenuEnabled={false} menu={null}
      adminPanel={<BusinessAdminForm organizationId="org-1" initialValues={{ businessName: "Test business", slug: "test", businessType: "" }} />}
    /></ToastProvider>);
  });
}
async function button(scope: TestRenderer.ReactTestInstance, text: string) {
  const node = scope.findAllByType("button").find((item) => item.children.includes(text));
  expect(node, text).toBeTruthy();
  await act(async () => { await node!.props.onClick(); });
}
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { if (renderer) act(() => renderer.unmount()); vi.unstubAllGlobals(); });

describe("unified Business Editor", () => {
  it("keeps one of each editor and retains Bio/Admin/Links drafts across section and responsive selection", async () => {
    await mount();
    const bio = renderer.root.findByType(BioEditor);
    const admin = renderer.root.findByType(BusinessAdminForm);
    await act(async () => bio.findByType("textarea").props.onChange({ target: { value: "Unsaved Bio" } }));
    await act(async () => admin.findByProps({ id: "businessName" }).props.onChange({ target: { value: "Unsaved name" } }));
    await button(renderer.root.findByType(LinksEditor), "+ Add Link");
    await act(async () => renderer.root.findByProps({ id: "link-value" }).props.onChange({ target: { value: "https://draft.example" } }));
    for (const label of ["design", "admin", "Preview", "Edit"]) await button(renderer.root, label);
    await act(async () => renderer.root.findByType(BlockStructureList).props.onSelect("BIO"));
    expect(renderer.root.findAllByType(ProfileSettingsPanel)).toHaveLength(1);
    expect(renderer.root.findAllByType(BioEditor)).toHaveLength(1);
    expect(renderer.root.findByType(BioEditor)).toBe(bio);
    expect(bio.findByType("textarea").props.value).toBe("Unsaved Bio");
    expect(admin.findByProps({ id: "businessName" }).props.value).toBe("Unsaved name");
    expect(renderer.root.findByProps({ id: "link-value" }).props.value).toBe("https://draft.example");
    expect(renderer.root.findAllByType(ProfileRenderer)).toHaveLength(1);
  });

  it("keeps Menu management and all three image workflows reachable without duplicating editors", async () => {
    await mount();
    expect(renderer.root.findByType(HeaderEditor).findAllByProps({ type: "file" })).toHaveLength(2);
    const design = renderer.root.findByType(DesignPanel);
    await button(design, "Image");
    expect(design.findAllByProps({ type: "file" })).toHaveLength(1);
    await button(renderer.root.findByType(MenuEditor), "Manage Menu");
    const menu = renderer.root.findByType(MenuManager);
    await button(renderer.root, "admin");
    await button(renderer.root, "design");
    expect(renderer.root.findByType(MenuManager)).toBe(menu);
  });

  it("submits explicit null for legacy clears and updates the same preview data", async () => {
    await mount();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ profile: { ...business.profile, whatsapp: null, website: null } }) });
    const contact = renderer.root.findByType(ContactEditor);
    await act(async () => contact.props.onChange({ whatsapp: "", website: "" }));
    await button(contact, "Save");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ whatsapp: null, website: null });
    const preview = renderer.root.findByType(ProfileRenderer).props;
    expect(preview.business.profile.whatsapp).toBeNull();
    expect(preview.business.profile.website).toBeNull();
  });

  it("restores persisted Bio preview on save failure and reports errors", async () => {
    await mount();
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Rejected", fieldErrors: { bio: ["Too long"] } }) });
    const bio = renderer.root.findByType(BioEditor);
    await act(async () => bio.findByType("textarea").props.onChange({ target: { value: "Draft" } }));
    await button(bio, "Save");
    expect(renderer.root.findByType(ProfileRenderer).props.business.profile.bio).toBe("Original");
    expect(JSON.stringify(renderer.toJSON())).toContain("Too long");
  });

  it("uses row IDs for block visibility/reorder and updates the shared preview order", async () => {
    await mount();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    await act(async () => renderer.root.findByType(BlockStructureList).props.onToggleVisible(blocks[0]));
    expect(fetchMock.mock.calls[0][0]).toContain("/blocks/row-0/visibility");
    await act(async () => renderer.root.findByType(BlockStructureList).props.onReorder([...blocks].reverse()));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ orderedIds: ["row-1", "row-0"] });
  });

  it("offers supported default design values without changing or deleting stored images", async () => {
    await mount();
    await button(renderer.root.findByType(DesignPanel), "Use default design (save to apply)");
    expect(renderer.root.findByType(DesignPanel).props.draft).toEqual({
      themeColor: "", backgroundType: "SOLID", backgroundColor: "", backgroundGradient: "", backgroundMode: "LIGHT",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("restored link form", () => {
  it.each([true, false])("creates with the chosen active state %s and offers every supported type", async (isActive) => {
    await mount();
    await button(renderer.root.findByType(LinksEditor), "+ Add Link");
    const form = renderer.root.findByType(ProfileLinkForm);
    expect(form.findAllByType("option").map((option) => option.props.value)).toEqual(LINK_TYPE_ORDER);
    await act(async () => form.findByProps({ id: "link-value" }).props.onChange({ target: { value: "https://example.com" } }));
    await act(async () => form.findByProps({ type: "checkbox" }).props.onChange({ target: { checked: isActive } }));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ link: { id: "new", type: "INSTAGRAM", url: "https://example.com", label: "Instagram", isActive } }) });
    await act(async () => form.findByType("form").props.onSubmit({ preventDefault() {} }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).isActive).toBe(isActive);
    expect(renderer.root.findByType(LinksEditor).props.links[0].isActive).toBe(isActive);
    expect(renderer.root.findByType(ProfileRenderer).props.business.profile.links).toHaveLength(isActive ? 1 : 0);
  });

  it("uses typed inputs and displays returned field errors without claiming success", async () => {
    await mount();
    await button(renderer.root.findByType(LinksEditor), "+ Add Link");
    const form = renderer.root.findByType(ProfileLinkForm);
    for (const [type, inputType] of [["PHONE", "tel"], ["EMAIL", "email"], ["WEBSITE", "url"]]) {
      await act(async () => form.findByProps({ id: "link-type" }).props.onChange({ target: { value: type } }));
      expect(form.findByProps({ id: "link-value" }).props.type).toBe(inputType);
    }
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ fieldErrors: { value: ["Invalid URL"] } }) });
    await act(async () => form.findByType("form").props.onSubmit({ preventDefault() {} }));
    expect(JSON.stringify(renderer.toJSON())).toContain("Invalid URL");
    expect(renderer.root.findByType(LinksEditor).props.links).toHaveLength(0);
  });

  it("reorders links using accessible controls and canonical row IDs", async () => {
    await mount();
    const links = ["a", "b"].map((id) => ({ id, type: "CUSTOM" as const, label: id, url: "https://example.com", isActive: true }));
    await act(async () => renderer.root.findByType(LinksEditor).props.onChange(links));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const down = renderer.root.findByType(LinksEditor).findAllByProps({ "aria-label": "Move link down" })[0];
    await act(async () => down.props.onClick());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ orderedIds: ["b", "a"] });
    expect(renderer.root.findByType(ProfileRenderer).props.business.profile.links.map((link: { id: string }) => link.id)).toEqual(["b", "a"]);
  });
});
