import { z } from "zod";
import { ProfileBlockKey } from "@prisma/client";

export const blockVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export const blockReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "No blocks to reorder."),
});

const alignmentEnum = z.enum(["left", "center"]);

/**
 * Per-block-type config validation. Never trust client-submitted JSON —
 * every block type has an explicit, narrow shape here. Unknown/extra
 * keys are stripped by default (zod object parsing), so this also
 * prevents a client from smuggling arbitrary data into `config`.
 */
export const headingConfigSchema = z.object({
  text: z.string().trim().min(1, "Heading text is required.").max(80),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  align: alignmentEnum.default("left"),
});

export const textConfigSchema = z.object({
  content: z.string().trim().min(1, "Text is required.").max(1000),
  align: alignmentEnum.default("left"),
});

export const dividerConfigSchema = z.object({
  style: z.enum(["simple", "subtle", "spaced"]).default("simple"),
});

export const reviewsConfigSchema = z.object({
  title: z.string().trim().max(60).optional(),
  style: z.enum(["standard", "card", "featured"]).default("standard"),
});

export const locationConfigSchema = z.object({
  buttonLabel: z.string().trim().max(40).optional(),
});

/** Dispatches to the right schema for a given block key — used by the config API route so validation stays centrally defined rather than duplicated per-route. */
export const CONFIG_SCHEMA_BY_KEY: Partial<Record<ProfileBlockKey, z.ZodTypeAny>> = {
  HEADING: headingConfigSchema,
  TEXT: textConfigSchema,
  DIVIDER: dividerConfigSchema,
  REVIEWS: reviewsConfigSchema,
  LOCATION: locationConfigSchema,
};

export const createBlockSchema = z.object({
  blockKey: z.nativeEnum(ProfileBlockKey),
  config: z.record(z.unknown()).default({}),
});
