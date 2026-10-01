"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import { networks, type V2Data, type V2Section, type V2Link } from "@/lib/profile-v2";
import type { ProfileDesign } from "@/lib/profile-design";
import { resolveProfileDesign, editableVisual } from "@/lib/profile-design";
import { EssentialDesignEditor } from "./EssentialDesignEditor";
import { EssentialSectionAppearance, LinkAppearance } from "./EssentialAppearance";
import {inheritVisual,type VisualOverride} from "@/lib/profile-visual";
import { CustomContentDraftEditor } from "./CustomContentDraftEditor";
import { parseSectionConfig } from "@/lib/profile-v2";
import { buildProfileViewModel } from "@/lib/profileView";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";
import { ProfilePreviewFrame } from "./ProfilePreviewFrame";
import { useToast } from "@/components/ui/Toast";
import type { BuilderSaveDraft } from "@/lib/profile-builder-draft";
import {builderDraftErrors} from "@/lib/profile-builder-draft";
import {isRenderableLinkValue} from "@/lib/linkTypes";
import { LINK_TYPE_META, LINK_TYPE_ORDER } from "@/lib/linkTypes";
import type { MenuWithContent } from "@/components/admin/MenuManager";
import { menuToBuilderDraft, type BuilderMenuDraft } from "@/lib/profile-builder-menu";
import { MenuDraftEditor } from "./MenuDraftEditor";
import { HeaderImagePicker } from "./HeaderImagePicker";
import { SortableList } from "./SortableList";
import { Upload } from "./V2Controls";
import { HeaderVisualControls } from "./VisualControls";
import { FooterEditor } from "./GlobalDesignControls";
import { useUploadActivity } from "./UploadActivity";
import { profilePresets } from "@/lib/profile-presets";
import type {CustomTheme} from "@/lib/custom-themes";
import {FiSliders,FiUser,FiLink,FiUsers,FiMail,FiBookOpen,FiImage,FiLayout,FiLock,FiPlus,FiArrowLeft,FiExternalLink,FiMoreVertical,FiTrash2,FiSmartphone} from "./BuilderIcons";
type ProfileFields = BuilderSaveDraft["profile"];
type Selection = {
    type: "design";
} | {
    type: "header";
} | {
    type: "section";
    id: string;
} | {
    type: "link";
    id: string;
    sectionId: string;
};
type Draft = {
    businessType: string;
    profile: ProfileFields;
    v2: V2Data;
    menu: BuilderMenuDraft;
};
const title = (s: V2Section) => s.singletonKey === "BIO" ? "Bio" : s.singletonKey === "BUSINESS_INFO" ? "Contact" : s.singletonKey === "MENU" ? "Menu" : s.kind === "SOCIALS" ? "Socials" : s.internalName;
const detail = (s: V2Section) => s.singletonKey === "LINKS" ? "Main links and buttons" : s.singletonKey === "BUSINESS_INFO" ? "Contact information" : s.kind === "SOCIALS" ? "Social media links" : s.singletonKey === "MENU" ? "Food and drink menu" : s.kind === "CUSTOM" ? `Custom profile content${s.items.length?` · ${s.items.map(item=>String(item.config.text||item.config.label||(item.kind==="CAROUSEL"?`Gallery (${item.images.length})`:item.kind==="IMAGE"?`Image (${item.images.length})`:item.kind.toLowerCase()))).join(", ").slice(0,80)}`:" · Empty"}` : "Profile content";
const glyph = (s: V2Section) => {const Icon=s.singletonKey==="LINKS"?FiLink:s.singletonKey==="MENU"?FiBookOpen:s.singletonKey==="BUSINESS_INFO"?FiMail:s.kind==="SOCIALS"?FiUsers:FiImage;return <Icon aria-hidden="true"/>;};
const inputClass = "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-accent)]";
const previewLink = (l: V2Link): BuilderSaveDraft["links"][number] => ({ id: l.id, type: l.type, label: l.label ?? "", value: l.url, isActive: l.isActive, presentation: { width: l.width as "FULL" | "HALF", iconMode: l.iconMode as "DEFAULT" | "CUSTOM" | "NONE", customIconAssetId: l.customIconAssetId, socialSectionId: l.socialSectionId, socialNetwork: l.socialNetwork as BuilderSaveDraft["links"][number]["presentation"]["socialNetwork"], v2IsVisible: l.v2IsVisible } });
const newId = () => `new-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
function Field({ label, value, onChange, multiline = false }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
}) { return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{multiline ? <textarea className={inputClass} rows={3} value={value} onChange={e => onChange(e.target.value)}/> : <input className={inputClass} value={value} onChange={e => onChange(e.target.value)}/>}</label>; }
function Switch({ checked, onChange, label }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) { return <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)} className={`builder-v3-switch ${checked ? "is-on" : ""}`}><span /></button>; }
function Choices({ label, options, value, onChange }: {
    label: string;
    options: {
        value: string;
        label: string;
    }[];
    value: string;
    onChange: (v: string) => void;
}) { return <fieldset className="space-y-2"><legend className="text-sm font-semibold">{label}</legend><div className="builder-v3-choices">{options.map(o => <button type="button" key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></fieldset>; }
export function BuilderV3({ organizationId, businessSlug, business, menuAvailable, isMenuEnabled=true, menu, customThemes=[], isSuperAdmin=false }: {
    isMenuEnabled?: boolean;
    customThemes?:CustomTheme[];
    isSuperAdmin?:boolean;
    organizationId: string;
    businessSlug: string;
    business: PublicBusinessProfile;
    menuAvailable: boolean;
    menu: MenuWithContent | null;
}) {
    const initial = useMemo<Draft>(() => ({ businessType:business.businessType??"", profile: { displayName: business.profile.displayName ?? "", bio: business.profile.bio ?? "", phone: business.profile.phone ?? "", email: business.profile.email ?? "", whatsapp: business.profile.whatsapp ?? "", website: business.profile.website ?? "", address: business.profile.address ?? "", googleMapsUrl: business.profile.googleMapsUrl ?? "", themeColor: business.profile.themeColor ?? null, logoUrl: business.profile.logoUrl ?? null, coverImageUrl: business.profile.coverImageUrl ?? null, backgroundImageUrl: business.profile.backgroundImageUrl ?? null }, v2: business.v2!, menu: menuToBuilderDraft(menu) }), [business, menu]);
    const [draft, setDraft] = useState<Draft>(initial), [baseline, setBaseline] = useState<Draft>(initial);
    const [selection, setSelection] = useState<Selection>({ type: "section", id: business.v2?.sections.find(s => s.singletonKey === "LINKS")?.id ?? business.v2?.sections[0]?.id ?? "" });
    const [mobileTab, setMobileTab] = useState<"structure" | "editor" | "preview">("editor");
    const [saveConflict,setSaveConflict]=useState(false);
    const [appearance, setAppearance] = useState(false), [showPicker, setShowPicker] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(""), [leaveTarget, setLeaveTarget] = useState<string | null>(null);
    const [basePresetName,setBasePresetName]=useState<string|null>(()=>profilePresets.find(preset=>JSON.stringify(preset.visual)===JSON.stringify(business.v2?.design?.visual))?.name??profilePresets.find(preset=>preset.visual.canvas?.color===business.v2?.design?.visual?.canvas?.color)?.name??null);
    const {active:activeUploads}=useUploadActivity();
    const { showToast } = useToast();
    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    useEffect(() => { if (typeof window === "undefined" || typeof window.addEventListener !== "function")
        return; const warn = (event: BeforeUnloadEvent) => { if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
    } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, []);
    useEffect(() => { if (typeof document === "undefined" || typeof document.addEventListener !== "function")
        return; const capture = (event: MouseEvent) => { if (!dirtyRef.current)
        return; const a = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]"); if (!a || a.target === "_blank" || a.closest(".builder-v3-preview"))
        return; const url = new URL(a.href, location.href); if (url.origin !== location.origin)
        return; event.preventDefault(); event.stopPropagation(); setLeaveTarget(url.href); }; document.addEventListener("click", capture, true); return () => document.removeEventListener("click", capture, true); }, []);
    const patchProfile = (key: keyof ProfileFields, value: string | null) => setDraft(d => {
        const linkType = ({ phone: "PHONE", email: "EMAIL", whatsapp: "WHATSAPP", website: "WEBSITE", googleMapsUrl: "GOOGLE_MAPS" } as Record<string, string>)[key];
        return { ...d, profile: { ...d.profile, [key]: value }, v2: key === "bio" ? {...d.v2,sections:d.v2.sections.map(section=>section.singletonKey==="BIO"?{...section,isVisible:!!value?.trim()}:section)} : linkType ? { ...d.v2, links: d.v2.links.map(l => l.type === linkType ? { ...l, url: value ?? "", isActive: !!value } : l) } : d.v2 };
    });
    const patchV2 = (fn: (v: V2Data) => V2Data) => setDraft(d => ({ ...d, v2: fn(d.v2) }));
    const patchMenu = (menu: BuilderMenuDraft) => setDraft(d => ({ ...d, menu }));
    const patchSection = (id: string, fn: (s: V2Section) => V2Section) => patchV2(v => ({ ...v, sections: v.sections.map(s => s.id === id ? fn(s) : s) }));
    const patchLink = (id: string, fn: (l: V2Link) => V2Link) => patchV2(v => ({ ...v, links: v.links.map(l => l.id === id ? fn(l) : l) }));
    const patchDesign = (fn: (design: ProfileDesign) => ProfileDesign) => patchV2(v => { const design = fn(resolveProfileDesign(v.design, v.theme)); return { ...v, theme: design.theme, design }; });
    const selected = selection.type === "section" ? draft.v2.sections.find(s => s.id === selection.id) : selection.type === "link" ? draft.v2.sections.find(s => s.id === selection.sectionId) : null;
    const selectedLink = selection.type === "link" ? draft.v2.links.find(l => l.id === selection.id) : null;
    const selectedLinkStyle=selected&&selectedLink?((selected.config.linkStyles as Record<string,VisualOverride&{subtitle?:string}> | undefined)?.[selectedLink.id]):undefined;
    const patchSelectedLinkStyle=(value:(VisualOverride&{subtitle?:string})|undefined)=>{if(!selected||!selectedLink)return;patchSection(selected.id,section=>{const styles={...(section.config.linkStyles as Record<string,unknown>|undefined)};if(value)styles[selectedLink.id]={...(styles[selectedLink.id] as object),...value};else {const subtitle=(styles[selectedLink.id] as {subtitle?:string}|undefined)?.subtitle;if(subtitle)styles[selectedLink.id]={subtitle};else delete styles[selectedLink.id];}return {...section,config:{...section.config,linkStyles:Object.keys(styles).length?styles:undefined}}})};
    const patchSelectedLinkChevron=(chevron:boolean|undefined)=>{if(!selected||!selectedLink)return;patchSection(selected.id,section=>{const styles={...(section.config.linkStyles as Record<string,unknown>|undefined)};if(chevron===undefined)delete styles[selectedLink.id];else {const current=(styles[selectedLink.id] as {action?:Record<string,unknown>}|undefined)??{};styles[selectedLink.id]={...current,action:{...current.action,chevron}}}return {...section,config:{...section.config,linkStyles:Object.keys(styles).length?styles:undefined}}})};
    const design = resolveProfileDesign(draft.v2.design, draft.v2.theme), visual = editableVisual(design);
    const basePreset=profilePresets.find(preset=>preset.name===basePresetName);
    const designCustomized=!!basePreset&&JSON.stringify(design.visual)!==JSON.stringify(basePreset.visual);
    const draftMenuAvailable=isMenuEnabled&&!!draft.menu?.isActive&&draft.menu.categories.some(category=>category.isActive&&category.items.some(item=>item.isActive));
    const firstVisibleLink=draft.v2.links.find(link=>link.isActive&&link.v2IsVisible&&!link.socialSectionId&&isRenderableLinkValue(link.type,link.url));
    const firstActionSection=[...draft.v2.sections].sort((a,b)=>a.position-b.position).find(section=>section.isVisible&&(section.singletonKey==="LINKS"&&!!firstVisibleLink||section.singletonKey==="MENU"&&draftMenuAvailable));
    const selectedLinkGlobal=inheritVisual({text:visual.typography?.label},selected?.kind==="SOCIALS"?visual.socials:{surface:visual.surface,action:visual.action},selected?.id===firstActionSection?.id&&selectedLink?.id===firstVisibleLink?.id?visual.primaryAction:undefined,selected?.config.visual as VisualOverride|undefined);
    const liveBusiness = useMemo<PublicBusinessProfile>(() => ({ ...business, businessType:draft.businessType||null, v2: draft.v2, profile: { ...business.profile, ...draft.profile, links: draft.v2.links.filter(l => l.isActive).map(l => ({ id: l.id, type: l.type, label: l.label, url: l.url })) } }), [business, draft]);
    const viewModel = useMemo(() => buildProfileViewModel(liveBusiness), [liveBusiness]);
    const orderedSections = [...draft.v2.sections].sort((a, b) => a.position - b.position);
    const contentSections = orderedSections.filter(s => s.singletonKey !== "BIO");
    const sectionLinks = (s: V2Section) => draft.v2.links.filter(l => s.kind === "SOCIALS" ? l.socialSectionId === s.id : s.singletonKey === "LINKS" ? !l.socialSectionId : false);
    const select = (next: Selection) => { setSelection(next); setAppearance(false); setMobileTab("editor"); };
    const orderSections = (rows: V2Section[]) => patchV2(v => { let index = 0; const ordered = v.sections.map(section => section.singletonKey === "BIO" ? section : rows[index++]); return { ...v, sections: ordered.map((section, position) => ({ ...section, position })) }; });
    const orderLinks = (rows: V2Link[], owner: string | null) => patchV2(v => { let index = 0; return { ...v, links: v.links.map(link => link.socialSectionId === owner ? rows[index++] : link) }; });
    const save = async () => {
        if (!dirty || saving || activeUploads>0)
            return;
        setSaving(true);
        setError("");
        setSaveConflict(false);
        try {
            const payload: BuilderSaveDraft = { revision: baseline.v2.revision, businessType:draft.businessType, profile: draft.profile, design: resolveProfileDesign(draft.v2.design, draft.v2.theme), menu: draft.menu, sections: draft.v2.sections.map(s => ({ id: s.id, kind: s.kind, singletonKey: s.singletonKey, internalName: s.internalName, visibleTitle: s.visibleTitle, isVisible: s.isVisible, config: s.config, items: s.items.map(i => ({ id: i.id, kind: i.kind as BuilderSaveDraft["sections"][number]["items"][number]["kind"], width: i.width as "FULL" | "HALF", isVisible: i.isVisible, config: i.config, referencedProfileLinkId: i.referencedProfileLinkId, images: i.images.map(m => ({ id: m.id, assetId: m.assetId, alt: m.alt, caption: m.caption, destinationUrl: m.destinationUrl })) })) })), links: draft.v2.links.map(previewLink) };
            const errors=builderDraftErrors(payload,baseline.v2.links);
            if(errors.length){setError(errors.join("\n"));return;}
            const response = await fetch(`/api/admin/businesses/${organizationId}/builder-save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const result = await response.json();
            if(response.status===409&&typeof result.error==="string"&&/changed elsewhere/i.test(result.error))setSaveConflict(true);
            if (!response.ok || !result.v2)
                throw new Error(result.error || "Save failed.");
            const next = { ...draft, v2: result.v2 as V2Data, menu: result.menu as BuilderMenuDraft };
            setDraft(next);
            setBaseline(next);
            showToast("Profile changes saved.");
            const selectedSectionId = selection.type === "section" ? selection.id : selection.type === "link" ? selection.sectionId : null;
            if (selectedSectionId) {
                const index = draft.v2.sections.findIndex(s => s.id === selectedSectionId);
                const persisted = result.v2.sections[index];
                if (persisted && (selectedSectionId.startsWith("new-") || selection.type === "link" && selection.id.startsWith("new-")))
                    setSelection({ type: "section", id: persisted.id });
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Unable to save. Please retry.");
        }
        finally {
            setSaving(false);
        }
    };
    const addSection = (kind: "SOCIALS" | "CUSTOM") => { const id = newId(), s: V2Section = { id, kind, singletonKey: kind === "SOCIALS" ? "SOCIALS" : null, internalName: kind === "SOCIALS" ? "Socials" : "Custom section", visibleTitle: null, position: draft.v2.sections.length, isVisible: true, config: parseSectionConfig(kind === "SOCIALS" ? "SOCIALS" : null, {}), items: kind === "CUSTOM" ? [{ id: newId(), kind: "TEXT", position: 0, width: "FULL", isVisible: true, config: { text: "" }, referencedProfileLinkId: null, images: [] }] : [] }; patchV2(v => ({ ...v, sections: [...v.sections, s] })); setShowPicker(false); select({ type: "section", id }); };
    const addLink = (section: V2Section) => { const id = newId(), social = section.kind === "SOCIALS"; const link: V2Link = { id, type: social ? "INSTAGRAM" : "CUSTOM", label: "", url: "", isActive: true, width: "FULL", iconMode: "DEFAULT", customIconAssetId: null, iconUrl: null, socialSectionId: social ? section.id : null, socialNetwork: social ? "INSTAGRAM" : null, v2IsVisible: true }; patchV2(v => ({ ...v, links: [...v.links, link] })); select({ type: "link", id, sectionId: section.id }); };
    const sections = contentSections;
    return <div className="builder-v3" data-builder-v3>
    <header className="builder-v3-toolbar"><div className="builder-v3-breadcrumb"><a href="/admin/businesses"><FiArrowLeft aria-hidden="true"/> Businesses</a><span>/</span><strong>{business.name}</strong></div><h1>Profile Builder</h1><div className="builder-v3-toolbar-actions"><a href={`/${businessSlug}`} target="_blank" rel="noopener noreferrer">View Live Profile <FiExternalLink aria-hidden="true"/></a><button type="button" className="builder-v3-save" disabled={!dirty || saving || activeUploads>0} onClick={save}>{activeUploads>0 ? "Uploading…" : saving ? "Saving…" : <><FiPlus aria-hidden="true"/> Save Changes</>}{dirty && <span className="builder-v3-dirty"/>}</button></div></header>
    {error && <div role="alert" className="builder-v3-error"><p className="whitespace-pre-wrap">{error}</p><p>{saveConflict?"Your draft is still here. This profile was changed elsewhere; retrying will not resolve the conflict. Keep this tab open while you copy any edits you want to keep, or reload the saved profile and discard this draft.":"Your edits remain in this browser. Correct the named fields, or retry Save Changes if the request failed."}</p>{saveConflict&&<button type="button" className="mt-2 font-semibold underline" onClick={()=>setLeaveTarget(window.location.href)}>Reload saved profile…</button>}</div>}
    <div className="builder-v3-mobile-tabs"><button type="button" aria-pressed={mobileTab === "structure"} onClick={() => setMobileTab("structure")}>Sections</button><button type="button" aria-pressed={mobileTab === "editor"} onClick={() => setMobileTab("editor")}>Edit</button><button type="button" aria-pressed={mobileTab === "preview"} onClick={() => setMobileTab("preview")}>Preview</button></div>
    <div className="builder-v3-columns" aria-busy={saving} inert={saving || undefined}>
      <aside className={`builder-v3-panel builder-v3-structure ${mobileTab === "structure" ? "is-mobile-active" : ""}`} aria-label="Profile structure">
        <button type="button" className={`builder-v3-design-row ${selection.type === "design" ? "is-selected" : ""}`} onClick={() => select({ type: "design" })}><span className="builder-v3-icon"><FiSliders aria-hidden="true"/></span><span><strong>Design</strong><small>Themes, colors, fonts, style</small></span></button>
        <h2 className="builder-v3-kicker">Profile sections</h2>
        <button type="button" className={`builder-v3-section-row ${selection.type === "header" ? "is-selected" : ""}`} onClick={() => select({ type: "header" })}><span className="builder-v3-icon"><FiUser aria-hidden="true"/></span><span className="builder-v3-row-copy"><strong>Header</strong><small>Logo, name, bio</small></span><span className="builder-v3-lock" aria-label="Fixed at top"><FiLock aria-hidden="true"/></span></button>
        <SortableList chromeIcons fallbackControls={false} selectedId={selection.type === "section" ? selection.id : selection.type === "link" ? selection.sectionId : null} items={sections} label={title} onOrder={orderSections}>
          {s => <div className={`builder-v3-section-row ${selection.type === "section" && selection.id === s.id || selection.type === "link" && selection.sectionId === s.id ? "is-selected" : ""}`}><button type="button" className="builder-v3-row-main" onClick={() => select({ type: "section", id: s.id })}><span className="builder-v3-icon">{glyph(s)}</span><span className="builder-v3-row-copy"><strong>{title(s)}</strong><small>{detail(s)}{s.config.visual ? " · Customized" : ""}</small></span></button><Switch checked={s.isVisible} label={`Show ${title(s)} on profile`} onChange={isVisible => patchSection(s.id, row => ({ ...row, isVisible }))}/></div>}
        </SortableList>
        <button type="button" className="builder-v3-add-section" onClick={() => setShowPicker(v => !v)}><FiPlus aria-hidden="true"/> Add Section</button>
        {showPicker && <div className="builder-v3-picker"><strong>Add to your profile</strong>{!sections.some(s => s.kind === "SOCIALS") && <button type="button" onClick={() => addSection("SOCIALS")}>Socials <small>Social media links</small></button>}<button type="button" onClick={() => addSection("CUSTOM")}>Custom section <small>Text, buttons, images and galleries</small></button></div>}
        <button type="button" className="builder-v3-section-row builder-v3-footer-row" onClick={() => select({ type: "section", id: "footer" })}><span className="builder-v3-icon"><FiLayout aria-hidden="true"/></span><span className="builder-v3-row-copy"><strong>Footer</strong><small>Profile footer</small></span><span className="builder-v3-lock" aria-label="Fixed at bottom"><FiLock aria-hidden="true"/></span></button>
        <p className="builder-v3-help">Drag the handles to reorder profile sections. Header and Footer stay in place.</p>
      </aside>
      <main className={`builder-v3-panel builder-v3-editor ${mobileTab === "editor" ? "is-mobile-active" : ""}`} aria-label="Profile editor">
        {selection.type === "section" && selection.id === "footer" ? <><div className="builder-v3-local-tabs"><button type="button" aria-pressed={!appearance} onClick={()=>setAppearance(false)}>Content</button><button type="button" aria-pressed={appearance} onClick={()=>setAppearance(true)}>Appearance</button></div><section className="builder-v3-card"><FooterEditor tab={appearance?"appearance":"content"} value={design} theme={design.theme} role="SUPER_ADMIN" showPolicy={false} onChange={next=>patchDesign(()=>next)}/></section></> : selection.type === "design" ? <EssentialDesignEditor customThemes={customThemes} isSuperAdmin={isSuperAdmin} organizationId={organizationId} design={design} presetName={basePresetName} customized={designCustomized||draft.v2.sections.some(section=>!!section.config.visual||!!section.config.linkStyles||section.items.some(item=>!!item.config.visual))} onPresetSelected={setBasePresetName} onChange={next => patchDesign(() => next)} backgroundUrl={draft.profile.backgroundImageUrl ?? null} coverUrl={draft.profile.coverImageUrl} onBackgroundChange={url => patchProfile("backgroundImageUrl", url)} accent={draft.profile.themeColor ?? ""} onAccentChange={color => patchProfile("themeColor", color || null)}/> :
            selection.type === "header" ? <><div className="builder-v3-editor-heading"><span className="builder-v3-large-icon"><FiUser aria-hidden="true"/></span><span><h2>Header</h2><p>Your public identity and introduction.</p></span></div><div className="builder-v3-local-tabs"><button type="button" aria-pressed={!appearance} onClick={() => setAppearance(false)}>Content</button><button type="button" aria-pressed={appearance} onClick={() => setAppearance(true)}>Appearance</button></div>{!appearance ? <section className="builder-v3-card space-y-4"><Field label="Profile name" value={draft.profile.displayName} onChange={v => patchProfile("displayName", v)}/><Field label="Business Type" value={draft.businessType} onChange={businessType=>setDraft(d=>({...d,businessType}))}/><Field label="Short bio" value={draft.profile.bio} multiline onChange={v => patchProfile("bio", v)}/></section> : <section className="builder-v3-card space-y-4"><HeaderVisualControls value={design} onChange={next=>patchDesign(()=>next)}/></section>}</> :
                selection.type === "link" && selectedLink && selected ? <><button type="button" className="builder-v3-back" onClick={() => select({ type: "section", id: selected.id })}><FiArrowLeft aria-hidden="true"/> {title(selected)}</button><div className="builder-v3-editor-heading"><span className="builder-v3-large-icon"><FiLink aria-hidden="true"/></span><span><h2>{selectedLink.label || "New link"}</h2><p>Edit this link.</p></span></div><section className="builder-v3-card space-y-4"><label className="block space-y-2 text-sm font-semibold">{selected.kind === "SOCIALS" ? "Social network" : "Link type"} <select className={inputClass} value={selected.kind === "SOCIALS" ? (selectedLink.socialNetwork ?? selectedLink.type) : selectedLink.type} disabled={selected.kind !== "SOCIALS" && ["PHONE", "WHATSAPP", "WEBSITE", "GOOGLE_MAPS"].includes(selectedLink.type)} onChange={e => patchLink(selectedLink.id, l => { const value = e.target.value; const type = (selected.kind === "SOCIALS" && !["INSTAGRAM", "FACEBOOK", "TIKTOK"].includes(value) ? "CUSTOM" : value) as V2Link["type"]; return { ...l, type, socialNetwork: selected.kind === "SOCIALS" ? value : null, label: l.label || (selected.kind === "SOCIALS" ? value.charAt(0) + value.slice(1).toLowerCase() : LINK_TYPE_META[type].defaultLabel) }; })}>{selected.kind === "SOCIALS" ? networks.map(network => <option key={network} value={network}>{network === "X" ? "X / Twitter" : network.charAt(0) + network.slice(1).toLowerCase()}</option>) : <>{LINK_TYPE_ORDER.filter(type => !["PHONE", "WHATSAPP", "WEBSITE", "GOOGLE_MAPS"].includes(type)).includes(selectedLink.type) ? null : <option value={selectedLink.type}>{LINK_TYPE_META[selectedLink.type].label}</option>}{LINK_TYPE_ORDER.filter(type => !["PHONE", "WHATSAPP", "WEBSITE", "GOOGLE_MAPS"].includes(type)).map(type => <option key={type} value={type}>{LINK_TYPE_META[type].label}</option>)}</>}</select></label><Field label="Title" value={selectedLink.label ?? ""} onChange={label => patchLink(selectedLink.id, l => ({ ...l, label }))}/>{(selected.kind!=="SOCIALS"||selected.config.composition==="CARDS")&&<Field label="Supporting text" value={selectedLinkStyle?.subtitle??""} onChange={subtitle=>patchSelectedLinkStyle({...selectedLinkStyle,subtitle})}/>}{["PHONE", "WHATSAPP", "WEBSITE", "GOOGLE_MAPS"].includes(selectedLink.type) ? <p className="builder-v3-note">This destination is managed in Contact. Edit it there to keep it consistent everywhere.</p> : <Field label={selectedLink.type === "EMAIL" ? "Email address" : "URL"} value={selectedLink.url} onChange={url => patchLink(selectedLink.id, l => ({ ...l, url }))}/>}<label className="block space-y-2 text-sm font-semibold">Icon <select className={inputClass} value={selectedLink.iconMode} onChange={e => patchLink(selectedLink.id, l => ({ ...l, iconMode: e.target.value, customIconAssetId: e.target.value === "CUSTOM" ? l.customIconAssetId : null, iconUrl: e.target.value === "CUSTOM" ? l.iconUrl : null }))}><option value="DEFAULT">Default icon</option><option value="CUSTOM">Custom icon</option><option value="NONE">No icon</option></select></label>{selectedLink.iconMode === "CUSTOM" && <div className="builder-v3-card space-y-3">{selectedLink.iconUrl && <img src={selectedLink.iconUrl} alt="Current custom icon" className="h-12 w-12 rounded-lg object-contain"/>}<Upload organizationId={organizationId} label={selectedLink.customIconAssetId ? "Replace custom icon" : "Upload custom icon"} onUploaded={async (asset) => patchLink(selectedLink.id, l => ({ ...l, iconMode: "CUSTOM", customIconAssetId: asset.id, iconUrl: asset.url }))}/>{selectedLink.customIconAssetId && <button type="button" className="builder-v3-delete" onClick={() => patchLink(selectedLink.id, l => ({ ...l, iconMode: "DEFAULT", customIconAssetId: null, iconUrl: null }))}>Remove custom icon</button>}<p className="builder-v3-note">The icon is applied to the profile only after Save Changes.</p></div>}<details className="builder-v3-advanced"><summary>Customize this link</summary><div className="space-y-4 pt-4"><Choices label="Width" value={selectedLink.width} options={[{ value: "FULL", label: "Full" }, { value: "HALF", label: "Half" }]} onChange={width => patchLink(selectedLink.id, l => ({ ...l, width }))}/><Choices label="Trailing arrow" value={(selectedLinkStyle?.action?.chevron ?? (selected.config.visual as {action?:{chevron?:boolean}}|undefined)?.action?.chevron ?? visual.action?.chevron ?? false) ? "YES" : "NO"} options={[{ value: "NO", label: "Hidden" }, { value: "YES", label: "Shown" }]} onChange={value => patchSelectedLinkChevron(value === "YES")}/>{selected.id===firstActionSection?.id&&selectedLink.id===firstVisibleLink?.id&&visual.primaryAction&&<p className="builder-v3-note">Your theme highlights this first visible action. Reordering changes which action is highlighted.</p>}<LinkAppearance value={selectedLinkStyle} global={selectedLinkGlobal} onChange={patchSelectedLinkStyle}/></div></details></section><button type="button" className="builder-v3-delete" onClick={() => { patchV2(v => ({ ...v, links: v.links.filter(l => l.id !== selectedLink.id) })); select({ type: "section", id: selected.id }); }}><FiTrash2 aria-hidden="true"/>Remove {selected.kind === "SOCIALS" ? "Social" : "Button"}</button></> :
                    selected ? <><div className="builder-v3-editor-heading"><span className="builder-v3-large-icon">{glyph(selected)}</span><span><h2>{title(selected)}</h2><p>{detail(selected)}</p>{!selected.isVisible&&<p className="builder-v3-note">Hidden on profile. Turn on its sidebar switch to show this section.</p>}</span></div><div className="builder-v3-local-tabs"><button type="button" aria-pressed={!appearance} onClick={() => setAppearance(false)}>Content</button><button type="button" aria-pressed={appearance} onClick={() => setAppearance(true)}>Appearance</button></div>{!appearance ? <section className="builder-v3-card space-y-4"><div className="builder-v3-card-heading"><span><h3>{title(selected)} {sectionLinks(selected).length ? `(${sectionLinks(selected).length})` : ""}</h3><p>{selected.singletonKey === "LINKS" ? "Add and manage the main links on your profile." : detail(selected)}</p></span>{["LINKS", "SOCIALS"].includes(selected.singletonKey ?? selected.kind) && <button type="button" className="builder-v3-add-link" onClick={() => addLink(selected)}><FiPlus aria-hidden="true"/> Add {selected.kind === "SOCIALS" ? "Social" : "Link"}</button>}</div>{["LINKS", "SOCIALS"].includes(selected.singletonKey ?? selected.kind) ? <div className="builder-v3-links"><SortableList chromeIcons fallbackControls={false} items={sectionLinks(selected)} label={link => link.label || "link"} onOrder={rows => orderLinks(rows, selected.kind === "SOCIALS" ? selected.id : null)}>{l => <div className="builder-v3-link-row"><button type="button" className="builder-v3-row-main" onClick={() => select({ type: "link", id: l.id, sectionId: selected.id })}><span className="builder-v3-icon"><FiLink aria-hidden="true"/></span><span className="builder-v3-row-copy"><strong>{l.label || "Untitled link"}{!!(selected.config.linkStyles as Record<string,unknown>|undefined)?.[l.id] && <span className="builder-v3-override-badge">Item style</span>}</strong><small>{l.url || "Add a destination"}</small></span></button><Switch checked={l.v2IsVisible} label={`Show ${l.label || "link"}`} onChange={v2IsVisible => patchLink(l.id, row => ({ ...row, v2IsVisible }))}/><details className="builder-v3-more"><summary aria-label={`More actions for ${l.label || "link"}`}><FiMoreVertical aria-hidden="true"/></summary><div><button type="button" onClick={() => { const id = newId(); patchV2(v => ({ ...v, links: [...v.links.slice(0, v.links.indexOf(l) + 1), { ...l, id, label: `${l.label || "Link"} copy` }, ...v.links.slice(v.links.indexOf(l) + 1)] })); }}>Duplicate</button><button type="button" onClick={() => patchV2(v => ({ ...v, links: v.links.filter(x => x.id !== l.id) }))}><FiTrash2 aria-hidden="true"/>Delete</button></div></details></div>}</SortableList>{!sectionLinks(selected).length && <p className="builder-v3-empty">No links yet. Add one to get started.</p>}</div> : selected.singletonKey === "BUSINESS_INFO" ? <div className="space-y-4">{([["phone", "Phone number", "phone"], ["email", "Email address", "email"], ["whatsapp", "WhatsApp number", "whatsapp"], ["website", "Website address", "website"], ["address", "Street address", "address"], ["googleMapsUrl", "Map link", "maps"]] as const).map(([key, label, visibilityKey]) => <div key={key} className="builder-v3-contact-field"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{label}</strong><span className="flex items-center gap-2 text-sm"><Switch checked={selected.config[visibilityKey] === true} label={`Show ${label}`} onChange={value => patchSection(selected.id, s => ({ ...s, config: { ...s.config, [visibilityKey]: value } }))}/>Show</span></div><Field label={label} value={draft.profile[key]} onChange={v => patchProfile(key, v)}/></div>)}</div> : selected.singletonKey === "BIO" ? <Field label="Bio" value={draft.profile.bio} multiline onChange={v => patchProfile("bio", v)}/> : selected.singletonKey === "MENU" ? <p className="builder-v3-note">Menu content is managed below. Visibility and appearance apply to this profile.</p> : <div className="space-y-3"><Field label="Section name" value={selected.internalName} onChange={internalName => patchSection(selected.id, s => ({ ...s, internalName }))}/><Field label="Heading on profile" value={selected.visibleTitle ?? ""} onChange={visibleTitle => patchSection(selected.id, s => ({ ...s, visibleTitle: visibleTitle || null }))}/><CustomContentDraftEditor organizationId={organizationId} items={selected.items} links={draft.v2.links} onChange={items => patchSection(selected.id, s => ({ ...s, items }))}/></div>}</section> : <EssentialSectionAppearance section={selected} global={visual} onChange={next => patchSection(selected.id, () => next)}/>} {selected.kind !== "CORE" && <details className="builder-v3-advanced"><summary>Section actions</summary><button type="button" className="builder-v3-delete" onClick={() => { if (!window.confirm("Delete this section? Its content will be removed after Save Changes. Shared business details and links will be kept."))
                        return; patchV2(v => ({ ...v, sections: v.sections.filter(s => s.id !== selected.id), links: v.links.map(l => l.socialSectionId === selected.id ? { ...l, socialSectionId: null, v2IsVisible: false } : l) })); select({ type: "design" }); }}><FiTrash2 aria-hidden="true"/>Delete section</button></details>}</> : <section className="builder-v3-card"><h2>Footer</h2><p className="builder-v3-note">The footer stays fixed at the bottom of your profile.</p></section>}
        {selection.type === "header" && !appearance && <div className="builder-v3-header-images"><HeaderImagePicker label="Logo" url={draft.profile.logoUrl} organizationId={organizationId} onChange={url => patchProfile("logoUrl", url)}/><HeaderImagePicker label="Cover image" url={draft.profile.coverImageUrl} organizationId={organizationId} onChange={url => patchProfile("coverImageUrl", url)}/></div>}
        {selection.type === "section" && selected?.singletonKey === "MENU" && !appearance && <details className="builder-v3-card builder-v3-menu-editor" open><summary className="cursor-pointer font-semibold">Manage Menu</summary><div className="pt-4"><MenuDraftEditor menu={draft.menu} onChange={patchMenu}/></div></details>}
      </main>
      <aside className={`builder-v3-panel builder-v3-preview ${mobileTab === "preview" ? "is-mobile-active" : ""}`} aria-label="Live preview"><div className="builder-v3-preview-top"><strong><span className="builder-v3-live-dot"/> Live Preview</strong><span><FiSmartphone aria-hidden="true"/>Mobile</span></div><div className="builder-v3-preview-surface" onClickCapture={event => { const target = event.target as HTMLElement; if (Number(target.closest<HTMLElement>(".social-icon-row")?.dataset.socialDragUntil??0)>performance.now()){event.preventDefault();event.stopPropagation();return;} if (!target.closest("[data-preview]"))
        return; event.preventDefault(); event.stopPropagation(); const sectionId = target.closest<HTMLElement>("[data-section-id]")?.dataset.sectionId; if (sectionId) {
        const linkNode = target.closest<HTMLElement>("[data-builder-link-id]");
        select(linkNode?.dataset.builderLinkId ? { type: "link", id: linkNode.dataset.builderLinkId, sectionId } : { type: "section", id: sectionId });
    }
    else
        select(target.closest("footer") ? { type: "section", id: "footer" } : { type: "header" }); }}><ProfilePreviewFrame><ProfileRenderer preview selectedSectionId={selection.type === "section" ? selection.id : selection.type === "link" ? selection.sectionId : undefined} business={liveBusiness} viewModel={viewModel} blocks={[]} menuAvailable={draftMenuAvailable} slug={businessSlug}/></ProfilePreviewFrame></div></aside>
    </div>
    {leaveTarget && <div role="presentation" className="builder-v3-modal-backdrop"><div role="dialog" aria-modal="true" aria-labelledby="builder-leave-title" className="builder-v3-modal"><h2 id="builder-leave-title">You have unsaved changes.</h2><p>Save your changes before leaving, or discard them.</p><div><button type="button" onClick={() => setLeaveTarget(null)}>Keep Editing</button><button type="button" onClick={() => { const target = leaveTarget; dirtyRef.current = false; setDraft(baseline); setLeaveTarget(null); window.location.assign(target); }}>Discard Changes</button></div></div></div>}
  </div>;
}
