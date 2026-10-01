"use client";
import {SaveCoordinator,SaveDomain} from "./profile-builder/SaveCoordinator";
import {DisclosureScope} from "./profile-builder/DisclosureScope";
import {reconcileFields} from "@/lib/reconcile-fields";

import {reconcileDesign,resolveProfileDesign} from "@/lib/profile-design";
import { useMemo, useState, useRef } from "react";
import type { V2Command, V2Data, V2Section, V2Link } from "@/lib/profile-v2";
import { V2Structure, V2SectionEditor, V2LinksEditor, BusinessInfoEditor } from "@/components/admin/profile-builder/V2Editor";
import { V2Upgrade } from "@/components/admin/profile-builder/V2Upgrade";
import {ProfilePreviewFrame} from "@/components/admin/profile-builder/ProfilePreviewFrame";
import { GlobalDesignControls } from "@/components/admin/profile-builder/GlobalDesignControls";
import {HeaderContentControls,HeaderVisualControls} from "./profile-builder/VisualControls";
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
import { BuilderV3 } from "./profile-builder/BuilderV3";
import { UploadActivityProvider } from "./profile-builder/UploadActivity";
import type {CustomTheme} from "@/lib/custom-themes";

interface ProfileBuilderShellProps {
  customThemes?:CustomTheme[];
  isSuperAdmin?:boolean;
  organizationId: string;
  businessSlug: string;
  business: PublicBusinessProfile;
  initialBlocks: ResolvedBlock[];
  menuAvailable: boolean;
  isMenuEnabled: boolean;
  menu: MenuWithContent | null;
  /** Kept for backward-compatible callers; administration is intentionally rendered outside the builder. */
  adminPanel?: React.ReactNode;
  initialLinks?: LinkLike[];
}

type EditorTab = "profile" | "design";
type MobileView = "structure" | "edit" | "preview";
type SelectedKey = ProfileBlockKey | "HEADER" | null;

interface DraftProfileFields {
  displayName: string;
  bio: string;
  phone: string;
  email: string;
  whatsapp: string;
  website: string;
  address: string;
  googleMapsUrl: string;
}

export function buildProfileContentPayload(fields: Partial<DraftProfileFields>) {
  const payload: Partial<Record<keyof DraftProfileFields, string | null>> = { ...fields };
  const nullableFields = ["bio", "phone", "email", "whatsapp", "website", "address", "googleMapsUrl"] as const;

  for (const field of nullableFields) {
    if (field in fields && fields[field]?.trim() === "") {
      payload[field] = null;
    }
  }

  return payload;
}

function reconcileProfileDraft(
  current: DraftProfileFields,
  submitted: Partial<DraftProfileFields>,
  persisted: DraftProfileFields
): DraftProfileFields {
  return {
    whatsapp: "whatsapp" in submitted && current.whatsapp === submitted.whatsapp ? persisted.whatsapp : current.whatsapp,
    website: "website" in submitted && current.website === submitted.website ? persisted.website : current.website,
    displayName:
      "displayName" in submitted && current.displayName === submitted.displayName
        ? persisted.displayName
        : current.displayName,
    bio: "bio" in submitted && current.bio === submitted.bio ? persisted.bio : current.bio,
    phone:
      "phone" in submitted && current.phone === submitted.phone ? persisted.phone : current.phone,
    email:
      "email" in submitted && current.email === submitted.email ? persisted.email : current.email,
    address:
      "address" in submitted && current.address === submitted.address
        ? persisted.address
        : current.address,
    googleMapsUrl:
      "googleMapsUrl" in submitted && current.googleMapsUrl === submitted.googleMapsUrl
        ? persisted.googleMapsUrl
        : current.googleMapsUrl,
  };
}

function reconcileDesignDraft(
  current: DesignDraft,
  submitted: DesignDraft,
  persisted: DesignDraft
): DesignDraft {
  return {
    themeColor: current.themeColor === submitted.themeColor ? persisted.themeColor : current.themeColor,
    backgroundType:
      current.backgroundType === submitted.backgroundType
        ? persisted.backgroundType
        : current.backgroundType,
    backgroundColor:
      current.backgroundColor === submitted.backgroundColor
        ? persisted.backgroundColor
        : current.backgroundColor,
    backgroundGradient:
      current.backgroundGradient === submitted.backgroundGradient
        ? persisted.backgroundGradient
        : current.backgroundGradient,
    backgroundMode:
      current.backgroundMode === submitted.backgroundMode
        ? persisted.backgroundMode
        : current.backgroundMode,
  };
}

export function ProfileBuilderShell(props:ProfileBuilderShellProps){return props.business.v2?.version===2?<UploadActivityProvider><BuilderV3 customThemes={props.customThemes} isSuperAdmin={props.isSuperAdmin} organizationId={props.organizationId} businessSlug={props.businessSlug} business={props.business} menuAvailable={props.menuAvailable} isMenuEnabled={props.isMenuEnabled} menu={props.menu}/></UploadActivityProvider>:<BuilderContent {...props}/>;}
function BuilderContent({
  organizationId,
  businessSlug,
  business,
  initialBlocks,
  menuAvailable,
  isMenuEnabled,
  menu,
  initialLinks,
}: ProfileBuilderShellProps) {
  const { showToast } = useToast();
  const [v2, setV2] = useState(business.v2);
  const savedV2 = useRef(business.v2);
  const currentV2 = useRef(v2);
  currentV2.current = v2;
  const v2Lock = useRef(false);
  const [v2Busy, setV2Busy] = useState(false);
  const [linkPreviews,setLinkPreviews]=useState<Record<string,V2Link>>({});
  const [infoPreview, setInfoPreview] = useState<Partial<DraftProfileFields>>({});
  const [sectionSettings,setSectionSettings] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  function previewSection(section: V2Section) {
    setSaveStatus("Changes pending");
    setV2(current => current ? { ...current, sections: current.sections.map(s => s.id === section.id ? section : s) } : current);
  }
  async function mutateV2(command: V2Command): Promise<boolean> {
    if (v2Lock.current || !savedV2.current) return false;
    v2Lock.current = true; setV2Busy(true); setSaveStatus("Saving…");
    const before = savedV2.current;
    const draftAtSubmit = currentV2.current;
    try {
      const r = await fetch(`/api/admin/businesses/${organizationId}/v2`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: before.revision, command }) });
      const result = await r.json();
      if (!r.ok || !result.v2) throw new Error(result.error || "Save failed.");
      const next: V2Data = result.v2;
      const assetsOf = (data: V2Data) => new Set([
        ...data.links.flatMap(l => l.customIconAssetId ? [l.customIconAssetId] : []),
        ...data.sections.flatMap(s => s.items.flatMap(i => i.images.map(m => m.assetId))),
      ]);
      const retainedAssets = assetsOf(next);
      for (const assetId of assetsOf(before)) {
        if (!retainedAssets.has(assetId)) {
          // The authenticated endpoint rechecks references under the profile lock.
          // Network failures leave an orphan asset, never a missing shared image.
          void fetch(`/api/admin/businesses/${organizationId}/v2/assets?assetId=${encodeURIComponent(assetId)}`, { method: "DELETE" }).catch(() => undefined);
        }
      }
      savedV2.current = next;
      setLinkPreviews(drafts => Object.fromEntries(Object.entries(drafts).flatMap(([id,local]) => {
        if(id.startsWith("new-")) return local.socialSectionId && !next.sections.some(s=>s.id===local.socialSectionId) ? [] : [[id,local]];
        const persisted=next.links.find(l=>l.id===id), previous=before.links.find(l=>l.id===id);
        if(!persisted||!previous) return [];
        return [[id,{...persisted,...Object.fromEntries(Object.entries(local).filter(([key,value])=>value!==previous[key as keyof V2Link]))}]];
      })));
      setV2(current => {
        if (!current) return next;
        const design=reconcileDesign(current.design,before.design,draftAtSubmit?.design,next.design,command.op);
        return { ...next, design, theme:design?.theme??next.theme, sections: next.sections.map(s => {
          const local = current.sections.find(x => x.id === s.id), old = before.sections.find(x => x.id === s.id);
          if (!local || !old) return s;
          const submitted = command.op === "section-update" && command.id === s.id ? command.data : null;
          const editable = { internalName: local.internalName, visibleTitle: local.visibleTitle, isVisible: local.isVisible, config: local.config };
          const reconciled=reconcileFields(editable,{internalName:old.internalName,visibleTitle:old.visibleTitle,isVisible:old.isVisible,config:old.config},{internalName:s.internalName,visibleTitle:s.visibleTitle,isVisible:s.isVisible,config:s.config},submitted??undefined);
          return { ...s, ...reconciled,
            items: s.items.map(i => {
              const li = local.items.find(x => x.id === i.id), oi = old.items.find(x => x.id === i.id);
              const submittedItem = command.op === "item-update" && command.id === i.id ? command.data : null;
              const currentItem = li ? { kind: li.kind, width: li.width, isVisible: li.isVisible, config: li.config, referencedProfileLinkId: li.referencedProfileLinkId } : null;
              return li&&oi&&currentItem ? {...i,...reconcileFields(currentItem,{kind:oi.kind,width:oi.width,isVisible:oi.isVisible,config:oi.config,referencedProfileLinkId:oi.referencedProfileLinkId},{kind:i.kind,width:i.width,isVisible:i.isVisible,config:i.config,referencedProfileLinkId:i.referencedProfileLinkId},submittedItem??undefined)} : i;
            }) };
        }) };
      });
      if (command.op === "info") {
        setInfoPreview({});
        const persisted = result.profile ?? command.data;
        const fields = Object.fromEntries(Object.keys(command.data).map(key => [key, persisted[key] ?? ""]));
        setDraft(current => ({ ...current, ...fields }));
        setPersistedDraft(current => ({ ...current, ...fields }));
      }
      setSaveStatus("Saved"); return true;
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : "Save failed. Draft is not published."); return false;
    } finally { v2Lock.current = false; setV2Busy(false); }
  }

  const [tab, setTab] = useState<EditorTab>("profile");
  const [mobileView, setMobileView] = useState<MobileView>("edit");
  const [selectedKey, setSelectedKey] = useState<SelectedKey>("HEADER");
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [blocks, setBlocks] = useState<ResolvedBlock[]>(initialBlocks);

  const initialDraft: DraftProfileFields = {
    displayName: business.profile.displayName ?? "",
    bio: business.profile.bio ?? "",
    phone: business.profile.phone ?? "",
    email: business.profile.email ?? "",
    whatsapp: business.profile.whatsapp ?? "",
    website: business.profile.website ?? "",
    address: business.profile.address ?? "",
    googleMapsUrl: business.profile.googleMapsUrl ?? "",
  };
  const [draft, setDraft] = useState<DraftProfileFields>(initialDraft);
  const [persistedDraft, setPersistedDraft] = useState<DraftProfileFields>(initialDraft);

  const initialDesignDraft: DesignDraft = {
    themeColor: business.profile.themeColor ?? "",
    backgroundType: business.profile.backgroundType ?? "SOLID",
    backgroundColor: business.profile.backgroundColor ?? "",
    backgroundGradient: business.profile.backgroundGradient ?? "",
    backgroundMode: business.profile.backgroundMode ?? "LIGHT",
  };
  const [designDraft, setDesignDraft] = useState<DesignDraft>(initialDesignDraft);
  const [persistedDesignDraft, setPersistedDesignDraft] =
    useState<DesignDraft>(initialDesignDraft);

  const [links, setLinks] = useState<LinkLike[]>(
    initialLinks ?? business.profile.links.map((link) => ({ ...link, isActive: true }))
  );
  const [images, setImages] = useState({
    logoUrl: business.profile.logoUrl,
    coverImageUrl: business.profile.coverImageUrl,
    backgroundImageUrl: business.profile.backgroundImageUrl,
  });
  const liveV2 = useMemo(() => v2 ? { ...v2, links: [...v2.links.map(link=>linkPreviews[link.id]??link),...Object.entries(linkPreviews).filter(([id])=>id.startsWith("new-")).map(([id,link])=>({...link,id}))].map(link => {
    const key = link.type === "WHATSAPP" ? "whatsapp" : link.type === "WEBSITE" ? "website" : link.type === "PHONE" ? "phone" : link.type === "GOOGLE_MAPS" ? "googleMapsUrl" : null;
    return key && key in infoPreview ? { ...link, url: infoPreview[key] || "", isActive: Boolean(infoPreview[key]) } : link;
  }) } : undefined, [v2, infoPreview, linkPreviews]);

  // The single object that drives the live preview — the original
  // server-fetched business data with every local, unsaved edit merged
  // in. This is what makes the preview update instantly as the admin
  // types, without waiting on a server round trip.
  const liveBusiness = useMemo<PublicBusinessProfile>(
    () => ({
      ...business,
      v2: liveV2,
      profile: {
        ...business.profile,
        displayName: draft.displayName,
        bio: draft.bio || null,
        phone: draft.phone || null,
        email: draft.email || null,
        whatsapp: draft.whatsapp || null,
        website: draft.website || null,
        address: draft.address || null,
        googleMapsUrl: draft.googleMapsUrl || null,
        themeColor: designDraft.themeColor || null,
        backgroundType: designDraft.backgroundType,
        backgroundColor: designDraft.backgroundColor || null,
        backgroundGradient: designDraft.backgroundGradient || null,
        backgroundMode: designDraft.backgroundMode,
        logoUrl: images.logoUrl,
        coverImageUrl: images.coverImageUrl,
        backgroundImageUrl: images.backgroundImageUrl,
        links: (liveV2?.version === 2 ? liveV2.links : links)
          .filter((link) => link.isActive)
          .map(({ isActive: _isActive, ...link }) => link),
      },
    }),
    [business, draft, designDraft, images, links, liveV2]
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
    setBusyBlockId(block.id);
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, isVisible: nextVisible } : b)));
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
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, isVisible: block.isVisible } : b)));
      showToast(error instanceof Error ? error.message : "Something went wrong.", "error");
    } finally {
      setBusyBlockId(null);
    }
  }

  function handleChangeDraft(fields: Partial<DraftProfileFields>) {
    setSaveStatus("Unsaved changes — preview includes drafts");
    setDraft((prev) => ({ ...prev, ...fields }));
  }

  async function handleSaveDraft(fields: Partial<DraftProfileFields>): Promise<boolean> {
    setSaveStatus("Saving…");
    setFieldErrors({});
    try {
      const payload = buildProfileContentPayload(fields);
      const response = await fetch(`/api/admin/businesses/${organizationId}/profile-content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.profile) {
        setFieldErrors(data.fieldErrors ?? {});
        setSaveStatus(data.error ?? "Save failed. Submitted preview values restored to saved data.");
        if(!v2)setDraft((current) => reconcileProfileDraft(current, fields, persistedDraft));
        return false;
      }

      const saved: DraftProfileFields = {
        displayName: data.profile.displayName ?? "",
        bio: data.profile.bio ?? "",
        phone: data.profile.phone ?? "",
        email: data.profile.email ?? "",
        whatsapp: data.profile.whatsapp ?? "",
        website: data.profile.website ?? "",
        address: data.profile.address ?? "",
        googleMapsUrl: data.profile.googleMapsUrl ?? "",
      };
      setPersistedDraft(saved);
      setSaveStatus("Saved this section");
      setDraft((current) => reconcileProfileDraft(current, fields, saved));
      return true;
    } catch {
      setSaveStatus("Save failed. Submitted preview values restored to saved data.");
      setDraft((current) => reconcileProfileDraft(current, fields, persistedDraft));
      return false;
    }
  }

  async function handleSaveDesign(submitted: DesignDraft): Promise<boolean> {
    setSaveStatus("Saving…");
    setFieldErrors({});
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/profile-content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeColor: submitted.themeColor,
          backgroundType: submitted.backgroundType,
          backgroundColor: submitted.backgroundColor,
          backgroundGradient: submitted.backgroundGradient,
          backgroundMode: submitted.backgroundMode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.profile) {
        setFieldErrors(data.fieldErrors ?? {});
        setSaveStatus(data.error ?? "Design save failed. Preview restored to saved design.");
        if(!v2)setDesignDraft((current) =>
          reconcileDesignDraft(current, submitted, persistedDesignDraft)
        );
        return false;
      }

      const saved: DesignDraft = {
        themeColor: data.profile.themeColor ?? "",
        backgroundType: data.profile.backgroundType ?? "SOLID",
        backgroundColor: data.profile.backgroundColor ?? "",
        backgroundGradient: data.profile.backgroundGradient ?? "",
        backgroundMode: data.profile.backgroundMode ?? "LIGHT",
      };
      setPersistedDesignDraft(saved);
      setSaveStatus("Saved design");
      setDesignDraft((current) => reconcileDesignDraft(current, submitted, saved));
      return true;
    } catch {
      setSaveStatus("Design save failed. Preview restored to saved design.");
      if(!v2)setDesignDraft((current) =>
        reconcileDesignDraft(current, submitted, persistedDesignDraft)
      );
      return false;
    }
  }

  function selectBlock(key: ProfileBlockKey | "HEADER") {
    setTab("profile"); setMobileView("edit");
    setSelectedKey(key);
    setSectionSettings(false);
    if (key === "HEADER") setSelectedSection(null);
  }

  const anchorClass = (selected:boolean) => cn(
    "flex w-full min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left hover:border-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10",
    selected ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10" : "border-[var(--admin-border)] bg-[var(--admin-card)]"
  );
  const structurePanel = (
          <nav aria-label="Profile content" className="space-y-2">
            <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Content</h2><button type="button" aria-pressed={tab==="design"} className={cn("rounded-lg px-3 py-2 text-sm font-medium",tab==="design"?"bg-[var(--admin-accent)] text-[var(--admin-accent-text)]":"bg-[var(--admin-card)] hover:bg-[var(--admin-hover)]")} onClick={()=>{setTab("design");setMobileView("edit");}}>Design</button></div>
            <button
              type="button"
              onClick={() => selectBlock("HEADER")}
              aria-pressed={selectedKey === "HEADER" && tab==="profile"}
              className={anchorClass(selectedKey === "HEADER" && tab==="profile")}
            >
              <span className="text-sm font-medium text-[var(--admin-text)]">Header</span>
              <Badge tone="gray">Always shown</Badge>
            </button>

            {v2?.version === 2 ? <V2Structure data={v2} persistedData={savedV2.current} selected={tab==="profile"?selectedSection:null} onSettings={id=>{setSelectedSection(id);setSectionSettings(true);setTab("profile");setMobileView("edit");setSelectedKey(null);}} busy={v2Busy} mutate={mutateV2} onSelect={id => {
              setSelectedSection(id); setMobileView("edit"); setSectionSettings(false); setTab("profile");
              const key = v2.sections.find(s => s.id === id)?.singletonKey;
              setSelectedKey(key && ["BIO","BUSINESS_INFO","LINKS","MENU"].includes(key) ? key as ProfileBlockKey : null);
            }} /> : <BlockStructureList
              blocks={liveBlocks}
              selectedKey={sectionSettings?null:selectedKey}
              busyBlockId={busyBlockId}
              onSelect={selectBlock}
              onReorder={handleReorder}
              onMove={handleMove}
              onToggleVisible={handleToggleVisible}
            />}
          </nav>
  );

  const editorPanel = (
    <div className="min-w-0 space-y-4">
      {/failed|error|stale|unable/i.test(saveStatus)&&<p role="alert" className="rounded-lg bg-[var(--admin-danger-bg)] p-3 text-sm text-[var(--admin-danger-text)]">{saveStatus}</p>}
      {Object.entries(fieldErrors).map(([field, errors]) => (
        <p role="alert" key={field} className="text-sm text-red-600">{field}: {errors.join(" ")}</p>
      ))}
      {(JSON.stringify(draft) !== JSON.stringify(persistedDraft) || JSON.stringify(designDraft) !== JSON.stringify(persistedDesignDraft)) && (
        <p className="text-sm">{v2?"Preview includes your latest edits. Changes publish when autosave completes.":"Unsaved changes. Save to publish."}</p>
      )}
      {v2&&<h2 className="text-xl font-semibold">{tab==="design"?"Profile design":selectedSection?v2.sections.find(s=>s.id===selectedSection)?.internalName:"Header"}</h2>}
      {v2&&tab==="profile"&&(selectedSection||selectedKey==="HEADER")&&<div className="inline-flex rounded-lg bg-[var(--admin-secondary)] p-1" aria-label="Section editing"><button type="button" aria-pressed={!sectionSettings} className="rounded-md px-4 py-2 text-sm font-medium aria-pressed:bg-[var(--admin-card)] aria-pressed:shadow-sm" onClick={()=>setSectionSettings(false)}>Content</button><button type="button" aria-pressed={sectionSettings} className="rounded-md px-4 py-2 text-sm font-medium aria-pressed:bg-[var(--admin-card)] aria-pressed:shadow-sm" onClick={()=>setSectionSettings(true)}>Appearance</button></div>}
      <div hidden={tab !== "profile"} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
            {selectedKey === "HEADER" && !sectionSettings && <Button type="button" variant="secondary" onClick={() => handleChangeDraft({ displayName: business.name })}>Use business name</Button>}
            <div hidden={sectionSettings}><ProfileSettingsPanel
              v2Mode={v2?.version === 2}
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
              onSelectBlock={selectBlock}
              isMenuEnabled={isMenuEnabled}
              menu={menu}
            /></div>
            {v2&&selectedKey==="HEADER"&&!sectionSettings&&<HeaderContentControls value={resolveProfileDesign(v2.design,v2.theme)} onChange={design=>setV2({...v2,design})}/>}
            {v2&&selectedKey==="HEADER"&&sectionSettings&&<HeaderVisualControls value={resolveProfileDesign(v2.design,v2.theme)} onChange={design=>setV2({...v2,design})}/>}
            {v2?.version === 2 && v2.sections.map(section => <div key={section.id} hidden={selectedSection !== section.id} className="space-y-5">
              {section.singletonKey === "BUSINESS_INFO" && <div hidden={sectionSettings}><BusinessInfoEditor business={{...liveBusiness,profile:{...liveBusiness.profile,...persistedDraft},v2:savedV2.current}} mutate={mutateV2} onPreview={fields => {
                setInfoPreview(fields); handleChangeDraft(fields);
              }} /></div>}
              <V2SectionEditor onCancelSettings={()=>{const saved=savedV2.current?.sections.find(s=>s.id===section.id);if(saved)previewSection({...saved,items:section.items});}} persistedSection={savedV2.current?.sections.find(s=>s.id===section.id)} settingsOnly={sectionSettings} onCancel={id=>{const saved=savedV2.current?.sections.find(s=>s.id===section.id)?.items.find(i=>i.id===id);if(saved)previewSection({...section,items:section.items.map(i=>i.id===id?saved:i)});}} section={section} organizationId={organizationId} data={v2} mutate={mutateV2} preview={previewSection} busy={v2Busy} />
              {(section.singletonKey === "LINKS" || section.kind === "SOCIALS") && <div hidden={sectionSettings}><V2LinksEditor onSectionPreview={previewSection} onPreview={(link,id)=>{setLinkPreviews(current=>{const next={...current};if(link)next[id]=link;else delete next[id];return next;});}} data={v2} sectionId={section.kind === "SOCIALS" ? section.id : null} organizationId={organizationId} mutate={mutateV2} busy={v2Busy} /></div>}
            </div>)}
      </div>
        <div hidden={tab !== "design"} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
          {v2?.version === 2 && <><GlobalDesignControls value={v2.design} theme={v2.theme} primaryColor={designDraft.themeColor} onPrimaryColorChange={themeColor=>setDesignDraft(current=>({...current,themeColor}))} onChange={design=>{setV2({...v2,theme:design.theme,design});setSaveStatus("Unsaved profile style");}} backgroundImageControl={<DesignPanel
            visualMode={v2?.version===2}
            accentEnabled={v2?.design?.accentEnabled!==false}
            organizationId={organizationId}
            draft={designDraft}
            onChange={(fields) => { setSaveStatus("Unsaved design changes"); setDesignDraft((prev) => ({ ...prev, ...fields })); }}
            onSave={handleSaveDesign}
            backgroundImageUrl={images.backgroundImageUrl}
            onBackgroundImageChange={(backgroundImageUrl) =>
              setImages((current) => ({ ...current, backgroundImageUrl }))
            }
          />}/><SaveDomain dirty={JSON.stringify({...resolveProfileDesign(v2.design,v2.theme),footer:undefined})!==JSON.stringify({...resolveProfileDesign(savedV2.current?.design,savedV2.current?.theme),footer:undefined})} onSave={()=>v2.design?mutateV2({op:"design",data:{...v2.design,footer:savedV2.current?.design?.footer}}):Promise.resolve(true)}>Save profile style</SaveDomain></>}
          {v2?.version !== 2 && <DesignPanel
            organizationId={organizationId}
            draft={designDraft}
            onChange={(fields) => setDesignDraft((prev) => ({ ...prev, ...fields }))}
            onSave={handleSaveDesign}
            backgroundImageUrl={images.backgroundImageUrl}
            onBackgroundImageChange={(backgroundImageUrl) => setImages((current) => ({ ...current, backgroundImageUrl }))}
          />}
        </div>
    </div>
  );

  const previewPanel = useMemo(() => (
    <ProfilePreviewFrame>
        <ProfileRenderer
          preview
          business={liveBusiness}
          viewModel={viewModel}
          blocks={visibleBlocks}
          menuAvailable={menuAvailable}
          slug={businessSlug}
        />
    </ProfilePreviewFrame>
  ), [liveBusiness,viewModel,visibleBlocks,menuAvailable,businessSlug]);

  return (
    <div className="builder-workspace">
      {v2&&<><SaveDomain dirty={draft.bio!==persistedDraft.bio||draft.displayName!==persistedDraft.displayName} onSave={()=>handleSaveDraft({...draft.bio!==persistedDraft.bio?{bio:draft.bio}:{},...draft.displayName!==persistedDraft.displayName?{displayName:draft.displayName}:{}})}/><SaveDomain dirty={JSON.stringify(designDraft)!==JSON.stringify(persistedDesignDraft)} onSave={()=>handleSaveDesign(designDraft)}/></>}
      {v2?.version !== 2 && <V2Upgrade organizationId={organizationId} />}
      <div className="builder-view-tabs mb-4 flex gap-2">
        <Button type="button" variant={mobileView==="structure"?"primary":"secondary"} onClick={()=>setMobileView("structure")}>Sections</Button>
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

      <div className="builder-grid">
        <section aria-label="Profile structure" data-builder-region="structure" className={cn(mobileView === "structure" ? "block" : "hidden", "builder-structure")}>
          {structurePanel}
        </section>
        <section aria-label="Central editor" data-builder-region="editor" className={cn(mobileView === "edit" ? "block" : "hidden", "builder-editor min-w-0")}>
          {editorPanel}
        </section>
        <div
          className={cn(
            mobileView === "preview" ? "block" : "hidden",
            "builder-preview"
          )}
        >
          <section aria-label="Live preview" data-builder-region="preview" onClickCapture={event=>{
            if(!v2)return;
            const target=event.target as HTMLElement;
            if(!target.closest("[data-preview]"))return;
            event.preventDefault();event.stopPropagation();
            const sectionId=target.closest<HTMLElement>("[data-section-id]")?.dataset.sectionId;
            if(sectionId){setSelectedSection(sectionId);const section=v2.sections.find(s=>s.id===sectionId);setSelectedKey(section?.singletonKey as SelectedKey);setSectionSettings(false);setTab("profile");}
            else if(target.closest("header,.visual-hero,[data-profile-cover]"))selectBlock("HEADER");
            else if(!target.closest("footer"))setTab("design");
            setMobileView("edit");
          }}>{previewPanel}</section>
        </div>
      </div>
    </div>
  );
}
