import type { ProfileBlockKey } from "@prisma/client";

export interface ResolvedBlock {
  id: string;
  key: ProfileBlockKey;
  label: string;
  description: string;
  position: number;
  isVisible: boolean;
  config: Record<string, unknown> | null;
  /** Whether there's actually content behind this block right now (e.g. REVIEWS needs a Google Reviews link to exist). Computed from real data — see computeBlockAvailability. System blocks only; always true for repeatable custom blocks (their content IS their config). */
  isAvailable: boolean;
}

export type BlockCategory = "essential" | "social" | "business" | "content";

export interface BlockDefinition {
  key: ProfileBlockKey;
  label: string;
  description: string;
  category: BlockCategory;
  /** Default position when a business has no saved override — this is what makes every existing business render unchanged. */
  defaultPosition: number;
  /** Can more than one instance exist on the same profile? (HEADING/TEXT/DIVIDER). System content blocks are singleton — enforced in the service layer, not a DB constraint. */
  repeatable: boolean;
  /** Whether "Add Block" should ever offer this type. System blocks backed by existing content (BIO, CONTACT, etc.) are pre-existing/always present and are never "added" — only repeatable custom blocks are addable. */
  addable: boolean;
  deletable: boolean;
  duplicatable: boolean;
}

/**
 * The fixed set of block types the Profile Builder supports.
 * "Header" is intentionally not here: it's locked to the top and isn't
 * hideable/reorderable/deletable (a profile without one doesn't make
 * sense) — it's edited directly via its own dedicated settings, not
 * through this list.
 *
 * Adding a genuinely new block type later means: one enum value, one
 * entry here, one case in ProfileRenderer's switch, one settings
 * component registered in blockEditors — nothing else in the shell
 * changes.
 */
export const BLOCK_REGISTRY: Record<ProfileBlockKey, BlockDefinition> = {
  BIO: {
    key: "BIO",
    label: "Bio",
    description: "Your business description, shown under the header.",
    category: "essential",
    defaultPosition: 1,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  CONTACT: {
    key: "CONTACT",
    label: "Contact",
    description: "Call and WhatsApp quick-action buttons.",
    category: "business",
    defaultPosition: 2,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  LOCATION: {
    key: "LOCATION",
    label: "Location",
    description: "Directions button and address.",
    category: "business",
    defaultPosition: 3,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  REVIEWS: {
    key: "REVIEWS",
    label: "Google Reviews",
    description: "Your Google Reviews link.",
    category: "business",
    defaultPosition: 4,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  MENU: {
    key: "MENU",
    label: "Digital Menu",
    description: "Link to your digital menu.",
    category: "business",
    defaultPosition: 5,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  LINKS: {
    key: "LINKS",
    label: "Links",
    description: "Instagram, Facebook, TikTok, Website, and other links.",
    category: "social",
    defaultPosition: 6,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  BUSINESS_INFO: {
    key: "BUSINESS_INFO",
    label: "Business Info",
    description: "Address, phone, and website shown as plain text.",
    category: "business",
    defaultPosition: 7,
    repeatable: false,
    addable: false,
    deletable: false,
    duplicatable: false,
  },
  HEADING: {
    key: "HEADING",
    label: "Heading",
    description: "A section title, e.g. \"Follow us\".",
    category: "essential",
    defaultPosition: 100,
    repeatable: true,
    addable: true,
    deletable: true,
    duplicatable: true,
  },
  TEXT: {
    key: "TEXT",
    label: "Text",
    description: "A free-form paragraph of text.",
    category: "essential",
    defaultPosition: 100,
    repeatable: true,
    addable: true,
    deletable: true,
    duplicatable: true,
  },
  DIVIDER: {
    key: "DIVIDER",
    label: "Divider",
    description: "A simple visual separator between sections.",
    category: "essential",
    defaultPosition: 100,
    repeatable: true,
    addable: true,
    deletable: true,
    duplicatable: true,
  },
};

/** The 7 original system keys — always present exactly once, resolved from existing content tables/fields. */
export const SYSTEM_BLOCK_ORDER: ProfileBlockKey[] = [
  "BIO",
  "CONTACT",
  "LOCATION",
  "REVIEWS",
  "MENU",
  "LINKS",
  "BUSINESS_INFO",
];

export const ADDABLE_BLOCK_KEYS: ProfileBlockKey[] = Object.values(BLOCK_REGISTRY)
  .filter((def) => def.addable)
  .map((def) => def.key);

export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  essential: "Essential",
  social: "Social",
  business: "Business",
  content: "Content",
};
