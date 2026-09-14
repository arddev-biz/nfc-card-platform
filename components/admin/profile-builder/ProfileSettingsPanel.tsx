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
  address: string;
  googleMapsUrl: string;
}

interface ProfileSettingsPanelProps {
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
  if (!selectedKey) {
    return (
      <p className="text-sm text-[var(--admin-text-secondary)]">
        Select a section on the left to edit it.
      </p>
    );
  }

  const title = selectedKey === "HEADER" ? "Header" : BLOCK_REGISTRY[selectedKey].label;

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-[var(--admin-text)]">{title}</h3>

      {selectedKey === "HEADER" && (
        <HeaderEditor
          organizationId={organizationId}
          draft={draft}
          onChange={onChangeDraft}
          onSave={onSaveDraft}
          logoUrl={logoUrl}
          coverImageUrl={coverImageUrl}
          onImagesChange={onImagesChange}
        />
      )}
      {selectedKey === "BIO" && <BioEditor draft={draft} onChange={onChangeDraft} onSave={onSaveDraft} />}
      {selectedKey === "CONTACT" && (
        <ContactEditor
          draft={draft}
          onChange={onChangeDraft}
          onSave={onSaveDraft}
          hasWhatsappLink={links.some((l) => l.type === "WHATSAPP")}
          onOpenLinks={() => onSelectBlock("LINKS")}
        />
      )}
      {selectedKey === "LOCATION" && (
        <LocationEditor draft={draft} onChange={onChangeDraft} onSave={onSaveDraft} />
      )}
      {selectedKey === "REVIEWS" && (
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
      )}
      {selectedKey === "MENU" && (
        <MenuEditor organizationId={organizationId} isEnabled={isMenuEnabled} menu={menu} />
      )}
      {selectedKey === "LINKS" && (
        <LinksEditor
          organizationId={organizationId}
          links={links.filter((l) => !["PHONE", "WHATSAPP", "GOOGLE_MAPS", "GOOGLE_REVIEWS"].includes(l.type))}
          onChange={(updatedSecondary) => {
            const kept = links.filter((l) =>
              ["PHONE", "WHATSAPP", "GOOGLE_MAPS", "GOOGLE_REVIEWS"].includes(l.type)
            );
            onChangeLinks([...kept, ...updatedSecondary]);
          }}
        />
      )}
      {selectedKey === "BUSINESS_INFO" && (
        <p className="text-sm text-[var(--admin-text-secondary)]">
          Shows your address, phone, and website as plain text. Edit those in the Location and
          Contact sections above.
        </p>
      )}
    </div>
  );
}
