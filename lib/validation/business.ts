import { z } from "zod";
import { profileContentUpdateSchema } from "@/lib/validation/profile-content";
import { emptyToUndefined, optionalText, optionalUrl, optionalPhone, PHONE_PATTERN } from "@/lib/validation/shared";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const businessInputSchema = z.object({
  // Business information
  businessName: z
    .string()
    .trim()
    .min(2, "Business name is required (at least 2 characters).")
    .max(200),
  slug: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        SLUG_PATTERN,
        "Use lowercase letters, numbers, and hyphens only (e.g. my-business)."
      )
      .max(100)
      .optional()
  ),
  businessType: optionalText(100),
  bio: optionalText(2000),

  // Contact information
  phone: optionalPhone("Phone"),
  whatsapp: optionalPhone("WhatsApp"),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Enter a valid email address.").max(200).optional()
  ),
  website: optionalUrl("Website"),

  // Location
  address: optionalText(300),
  googleMapsUrl: optionalUrl("Google Maps URL"),

  // Profile
  displayName: optionalText(200),
  themeColor: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(HEX_COLOR_PATTERN, "Enter a valid hex color, e.g. #4F46E5.")
      .optional()
  ),

  // Background customization (Phase 11 Step 2). backgroundImageUrl is
  // deliberately not here — it's managed via the existing image-upload
  // endpoint, same as logoUrl/coverImageUrl.
  backgroundType: z.preprocess(
    emptyToUndefined,
    z.enum(["SOLID", "GRADIENT", "IMAGE"]).optional()
  ),
  backgroundColor: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(HEX_COLOR_PATTERN, "Enter a valid hex color, e.g. #4F46E5.")
      .optional()
  ),
  backgroundGradient: z.preprocess(
    emptyToUndefined,
    z.enum(["INDIGO", "PURPLE", "BLUE", "SUNSET", "EMERALD", "ROSE", "DARK"]).optional()
  ),
  backgroundMode: z.preprocess(emptyToUndefined, z.enum(["LIGHT", "DARK"]).optional()),
});

export type BusinessInput = z.infer<typeof businessInputSchema>;

// The existing PATCH contract preserves omission but treats explicit blanks as clears.
export const businessUpdateSchema = businessInputSchema.extend({
  ...profileContentUpdateSchema.shape,
  businessType: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
  whatsapp: z.preprocess(emptyToNull, z.string().trim().regex(PHONE_PATTERN).max(30).nullable().optional()),
  website: z.preprocess(emptyToNull, z.string().trim().url().max(500).nullable().optional()),
});
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;

export const businessAdminUpdateSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name is required (at least 2 characters).")
    .max(200),
  slug: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        SLUG_PATTERN,
        "Use lowercase letters, numbers, and hyphens only (e.g. my-business)."
      )
      .max(100)
      .optional()
  ),
  businessType: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()),
});

export type BusinessAdminUpdateInput = z.infer<typeof businessAdminUpdateSchema>;

export const statusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
});
