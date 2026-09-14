"use client";

import { useMemo, useState } from "react";
import type { ProfileBlockKey } from "@prisma/client";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { ResolvedBlock } from "@/lib/blocks/registry";
import { buildProfileViewModel } from "@/lib/profileView";
import { computeAvailabilityFromViewModel } from "@/lib/blocks/availability";
import type { MenuWithContent } from "@/components/admin/MenuManager";
import { BlockStructureList } from "@/components/admin/profile-builder/BlockStructureList";
import { ProfileSettingsPanel } from "@/components/admin/profile-builder/ProfileSettingsPanel";
import { DesignPanel, type DesignDraft } from "@/components/admin/profile-builder/DesignPanel";
import type { LinkLike } from "@/components/admin/profile-builder/ReviewsEditor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface ProfileBuilderShellProps {
  organizationId: string;
  businessSlug: string;
  business: PublicBusinessProfile;
  initialBlocks: ResolvedBlock[];
  menuAvailable: boolean;
  isMenuEnabled: boolean;
  menu: MenuWithContent | null;
}

type EditorTab = "content" | "design";
type MobileView = "edit" | "preview";
type SelectedKey = ProfileBlockKey | "HEADER" | null;

interface DraftProfileFields {
  displayName: string;
  bio: string;
  phone: string;
  address: string;
  googleMapsUrl: string;
}

export function ProfileBuilderShell({
  organizationId,
  businessSlug,
  business,
  initialBlocks,
  menuAvailable,
  isMenuEnabled,
  menu,
}: ProfileBuilderShellProps) {
  const { showToast } = useToast();

  const [tab, setTab] = useState<EditorTab>("content");
  const [mobileView, setMobileView] = useState<MobileView>("edit");
  const [selectedKey, setSelectedKey] = useState<SelectedKey>("HEADER");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<ResolvedBlock[]>(initialBlocks);

  const [draft, setDraft] = useState<DraftProfileFields>({
    displayName: business.profile.displayName ?? "",
    bio: business.profile.bio ?? "",
    phone: business.profile.phone ?? "",
    address: business.profile.address ?? "",
    googleMapsUrl: business.profile.googleMapsUrl ?? "",
  });

  const [designDraft, setDesignDraft] = useState<DesignDraft>({
    themeColor: business.profile.themeColor ?? "",
    backgroundType: business.profile.backgroundType ?? "SOLID",
    backgroundColor: business.profile.backgroundColor ?? "",
    backgroundGradient: business.profile.backgroundGradient ?? "",
    backgroundMode: business.profile.backgroundMode ?? "LIGHT",
  });

  const [links, setLinks] = useState<LinkLike[]>(business.profile.links);
  const [images, setImages] = useState({
    logoUrl: business.profile.logoUrl,
    coverImageUrl: business.profile.coverImageUrl,
  });

  // The single object that drives the live preview — the original
  // server-fetched business data with every local, unsaved edit merged
  // in. This is what makes the preview update instantly as the admin
  // types, without waiting on a server round trip.
  const liveBusiness = useMemo<PublicBusinessProfile>(
    () => ({
      ...business,
      profile: {
        ...business.profile,
        displayName: draft.displayName,
        bio: draft.bio || null,
        phone: draft.phone || null,
        address: draft.address || null,
        googleMapsUrl: draft.googleMapsUrl || null,
        themeColor: designDraft.themeColor || null,
        backgroundType: designDraft.backgroundType,
        backgroundColor: designDraft.backgroundColor || null,
        backgroundGradient: designDraft.backgroundGradient || null,
        backgroundMode: designDraft.backgroundMode,
        logoUrl: images.logoUrl,
        coverImageUrl: images.coverImageUrl,
        links,
      },
    }),
    [business, draft, designDraft, images, links]
  );

  const viewModel = useMemo(() => buildProfileViewModel(liveBusiness), [liveBusiness]);

  const availability = useMemo(
    () => computeAvailabilityFromViewModel(liveBusiness, viewModel, menuAvailable),
    [liveBusiness, viewModel, menuAvailable]
  );

  // Structural blocks (position/visibility, persisted) with their
  // "has real content" flag refreshed live from the current draft —
  // so e.g. typing a Bio for the first time immediately clears its
  // "No content yet" indicator, without a save or refresh.
  const liveBlocks = useMemo(
    () => blocks.map((b) => ({ ...b, isAvailable: availability[b.key] })),
    [blocks, availability]
  );

  const visibleBlocks = useMemo(
    () => liveBlocks.filter((b) => b.isVisible && b.isAvailable),
    [liveBlocks]
  );

  async function persistOrder(next: ResolvedBlock[]) {
    const response = await fetch(`/api/admin/businesses/${organizationId}/blocks/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((b) => b.id) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Something went wrong reordering blocks.");
    }
  }

  async function handleReorder(next: ResolvedBlock[]) {
    const previous = blocks;
    setBlocks(next);
    try {
      await persistOrder(next);
    } catch (error) {
      setBlocks(previous);
      showToast(error instanceof Error ? error.message : "Something went wrong.", "error");
    }
  }

  function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= liveBlocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    void handleReorder(reordered.map((b, i) => ({ ...b, position: i })));
  }

  async function handleToggleVisible(block: ResolvedBlock) {
    const nextVisible = !block.isVisible;
    setBusyKey(block.key);
    setBlocks((prev) => prev.map((b) => (b.key === block.key ? { ...b, isVisible: nextVisible } : b)));
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/blocks/${block.id}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: nextVisible }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong updating this block.");
      }
      showToast(`${block.label} ${nextVisible ? "shown" : "hidden"}.`);
    } catch (error) {
      setBlocks((prev) => prev.map((b) => (b.key === block.key ? { ...b, isVisible: block.isVisible } : b)));
      showToast(error instanceof Error ? error.message : "Something went wrong.", "error");
    } finally {
      setBusyKey(null);
    }
  }

  function handleChangeDraft(fields: Partial<DraftProfileFields>) {
    setDraft((prev) => ({ ...prev, ...fields }));
  }

  async function handleSaveDraft(fields: Partial<DraftProfileFields>): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/profile-content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  const editorPanel = (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-[var(--admin-border)] p-1">
        {(["content", "design"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
                : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedKey("HEADER")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left",
                selectedKey === "HEADER"
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10"
                  : "border-[var(--admin-border)] bg-[var(--admin-card)]"
              )}
            >
              <span className="text-sm font-medium text-[var(--admin-text)]">Header</span>
              <Badge tone="gray">Always shown</Badge>
            </button>

            <BlockStructureList
              blocks={liveBlocks}
              selectedKey={selectedKey}
              busyKey={busyKey}
              onSelect={setSelectedKey}
              onReorder={handleReorder}
              onMove={handleMove}
              onToggleVisible={handleToggleVisible}
            />
          </div>

          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
            <ProfileSettingsPanel
              organizationId={organizationId}
              selectedKey={selectedKey}
              draft={draft}
              onChangeDraft={handleChangeDraft}
              onSaveDraft={handleSaveDraft}
              logoUrl={images.logoUrl}
              coverImageUrl={images.coverImageUrl}
              onImagesChange={(fields) => setImages((prev) => ({ ...prev, ...fields }))}
              links={links}
              onChangeLinks={setLinks}
              onSelectBlock={setSelectedKey}
              isMenuEnabled={isMenuEnabled}
              menu={menu}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
          <DesignPanel
            organizationId={organizationId}
            draft={designDraft}
            onChange={(fields) => setDesignDraft((prev) => ({ ...prev, ...fields }))}
            hasBackgroundImage={Boolean(business.profile.backgroundImageUrl)}
          />
        </div>
      )}
    </div>
  );

  const previewPanel = (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border-8 border-[var(--admin-text)]/10 shadow-lg">
      <div className="h-[640px] overflow-y-auto">
        <ProfileRenderer
          business={liveBusiness}
          viewModel={viewModel}
          blocks={visibleBlocks}
          menuAvailable={menuAvailable}
          slug={businessSlug}
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex gap-2 lg:hidden">
        <Button
          type="button"
          variant={mobileView === "edit" ? "primary" : "secondary"}
          onClick={() => setMobileView("edit")}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant={mobileView === "preview" ? "primary" : "secondary"}
          onClick={() => setMobileView("preview")}
        >
          Preview
        </Button>
      </div>

      <div className="lg:hidden">{mobileView === "edit" ? editorPanel : previewPanel}</div>

      <div className="hidden gap-8 lg:grid lg:grid-cols-[1fr_420px]">
        {editorPanel}
        <div className="sticky top-6 self-start">{previewPanel}</div>
      </div>
    </div>
  );
}
