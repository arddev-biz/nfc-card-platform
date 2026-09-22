"use client";

import type { ProfileBlockKey } from "@prisma/client";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { HeaderEditor, BioEditor, ContactEditor, LocationEditor } from "@/components/admin/profile-builder/BlockEditors";
import { ReviewsEditor, type LinkLike } from "@/components/admin/profile-builder/ReviewsEditor";
import { LinksEditor } from "@/components/admin/profile-builder/LinksEditor";
import { MenuEditor } from "@/components/admin/profile-builder/MenuEditor";
import type { MenuWithContent } from "@/components/admin/MenuManager";

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

interface ProfileSettingsPanelProps {
  v2Mode?: boolean;
  organizationId: string;
  selectedKey: ProfileBlockKey | "HEADER" | null;
  draft: DraftProfileFields;
  onChangeDraft: (fields: Partial<DraftProfileFields>) => void;
  onSaveDraft: (fields: Partial<DraftProfileFields>) => Promise<boolean>;
  logoUrl: string | null;
  coverImageUrl: string | null;
  onImagesChange: (fields: { logoUrl?: string | null; coverImageUrl?: string | null }) => void;
  links: LinkLike[];
  onChangeLinks: (links: LinkLike[]) => void;
  onSelectBlock: (key: ProfileBlockKey) => void;
  isMenuEnabled: boolean;
  menu: MenuWithContent | null;
}

export function ProfileSettingsPanel({
  v2Mode = false,
  organizationId,
  selectedKey,
  draft,
  onChangeDraft,
  onSaveDraft,
  logoUrl,
  coverImageUrl,
  onImagesChange,
  links,
  onChangeLinks,
  onSelectBlock,
  isMenuEnabled,
  menu,
}: ProfileSettingsPanelProps) {
  if (!selectedKey && !v2Mode) {
    return (
      <p className="text-sm text-[var(--admin-text-secondary)]">
        Select a section on the left to edit it.
      </p>
    );
  }

  const title = selectedKey === "HEADER" ? "Header" : selectedKey ? BLOCK_REGISTRY[selectedKey].label : "";

  return (
    <div>
      {title&&(!v2Mode||["HEADER","BIO","MENU"].includes(selectedKey??""))&&<h3 className="mb-4 text-sm font-semibold text-[var(--admin-text)]">{title}</h3>}

      <div hidden={selectedKey !== "HEADER"}>
        <HeaderEditor
          organizationId={organizationId}
          draft={draft}
          onChange={onChangeDraft}
          onSave={onSaveDraft}
          logoUrl={logoUrl}
          coverImageUrl={coverImageUrl}
          onImagesChange={onImagesChange}
        />
      </div>
      <div hidden={selectedKey !== "BIO"}><BioEditor draft={draft} onChange={onChangeDraft} onSave={onSaveDraft} /></div>
      {!v2Mode && <div hidden={selectedKey !== "CONTACT"}>
        <ContactEditor
          draft={draft}
          onChange={onChangeDraft}
          onSave={onSaveDraft}
          hasWhatsappLink={links.some((l) => l.type === "WHATSAPP")}
          onOpenLinks={() => onSelectBlock("LINKS")}
        />
      </div>}
      {!v2Mode && <div hidden={selectedKey !== "LOCATION"}>
        <LocationEditor draft={draft} onChange={onChangeDraft} onSave={onSaveDraft} />
      </div>}
      {!v2Mode && <div hidden={selectedKey !== "REVIEWS"}>
        <ReviewsEditor
          organizationId={organizationId}
          reviewsLink={links.find((l) => l.type === "GOOGLE_REVIEWS")}
          onSaved={(link) =>
            onChangeLinks(
              links.some((l) => l.id === link.id)
                ? links.map((l) => (l.id === link.id ? link : l))
                : [...links, link]
            )
          }
        />
      </div>}
      <div hidden={selectedKey !== "MENU"}>
        <MenuEditor organizationId={organizationId} isEnabled={isMenuEnabled} menu={menu} />
      </div>
      {!v2Mode && <div hidden={selectedKey !== "LINKS"}>
        <LinksEditor
          organizationId={organizationId}
          links={links}
          onChange={onChangeLinks}
        />
      </div>}
      {!v2Mode && <div hidden={selectedKey !== "BUSINESS_INFO"}>
        <p className="text-sm text-[var(--admin-text-secondary)]">
          Shows your address, phone, and legacy website details as plain text. Edit address in
          Location, phone in Contact, and the canonical website in Links.
        </p>
      </div>}
    </div>
  );
}
