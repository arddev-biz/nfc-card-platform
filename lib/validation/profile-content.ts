import { z } from "zod";
import { emptyToUndefined, PHONE_PATTERN } from "@/lib/validation/shared";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const nullableText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const nullableUrl = (label: string, max = 500) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .url(`${label} must be a valid URL, including https://`)
      .max(max)
      .nullable()
      .optional()
  );

const nullablePhone = (label: string, max = 30) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(PHONE_PATTERN, `${label} must be a valid phone number.`)
      .max(max)
      .nullable()
      .optional()
  );

const nullableEmail = z.preprocess(
  emptyToNull,
  z.string().trim().email("Enter a valid email address.").max(200).nullable().optional()
);

/**
 * Every field optional and independently validated. The Profile Builder
 * calls this endpoint once per block/panel edit (e.g. saving just the
 * Bio block sends only `bio`), so this must never require the full
 * Business Details form's required fields (like businessName) the way
 * the existing full-edit endpoint does.
 */
export const profileContentUpdateSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(200).optional(),
  bio: nullableText(2000),
  phone: nullablePhone("Phone"),
  email: nullableEmail,
  whatsapp: nullablePhone("Legacy WhatsApp"),
  website: nullableUrl("Legacy website"),
  address: nullableText(300),
  googleMapsUrl: nullableUrl("Google Maps URL"),
  themeColor: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(HEX_COLOR_PATTERN, "Enter a valid hex color, e.g. #4F46E5.")
      .nullable()
      .optional()
  ),
  backgroundType: z.preprocess(emptyToUndefined, z.enum(["SOLID", "GRADIENT", "IMAGE"]).optional()),
  backgroundColor: z.preprocess(
    emptyToNull,
    z.string().trim().regex(HEX_COLOR_PATTERN, "Enter a valid hex color.").nullable().optional()
  ),
  backgroundGradient: z.preprocess(
    emptyToNull,
    z
      .enum(["INDIGO", "PURPLE", "BLUE", "SUNSET", "EMERALD", "ROSE", "DARK"])
      .nullable()
      .optional()
  ),
  backgroundMode: z.preprocess(emptyToUndefined, z.enum(["LIGHT", "DARK"]).optional()),
});

export type ProfileContentUpdateInput = z.infer<typeof profileContentUpdateSchema>;
