import { z } from "zod";
import { emptyToUndefined, optionalText, optionalUrl, optionalPhone } from "@/lib/validation/shared";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

/**
 * Every field optional and independently validated. The Profile Builder
 * calls this endpoint once per block/panel edit (e.g. saving just the
 * Bio block sends only `bio`), so this must never require the full
 * Business Details form's required fields (like businessName) the way
 * the existing full-edit endpoint does.
 */
export const profileContentUpdateSchema = z.object({
  displayName: optionalText(200),
  bio: optionalText(2000),
  phone: optionalPhone("Phone"),
  address: optionalText(300),
  googleMapsUrl: optionalUrl("Google Maps URL"),
  themeColor: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(HEX_COLOR_PATTERN, "Enter a valid hex color, e.g. #4F46E5.").optional()
  ),
  backgroundType: z.preprocess(emptyToUndefined, z.enum(["SOLID", "GRADIENT", "IMAGE"]).optional()),
  backgroundColor: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(HEX_COLOR_PATTERN, "Enter a valid hex color.").optional()
  ),
  backgroundGradient: z.preprocess(
    emptyToUndefined,
    z.enum(["INDIGO", "PURPLE", "BLUE", "SUNSET", "EMERALD", "ROSE", "DARK"]).optional()
  ),
  backgroundMode: z.preprocess(emptyToUndefined, z.enum(["LIGHT", "DARK"]).optional()),
});

export type ProfileContentUpdateInput = z.infer<typeof profileContentUpdateSchema>;
