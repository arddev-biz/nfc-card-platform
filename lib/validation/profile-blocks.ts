import { z } from "zod";
import { ProfileBlockKey } from "@prisma/client";

export const blockVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export const blockReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "No blocks to reorder."),
});

/**
 * Per-block-type config validation. Never trust client-submitted JSON —
 * every block type has an explicit, narrow shape here. Unknown/extra
 * keys are stripped by default (zod object parsing), so this also
 * prevents a client from smuggling arbitrary data into `config`.
 */
export const reviewsConfigSchema = z.object({
  title: z.string().trim().max(60).optional(),
  style: z.enum(["standard", "card", "featured"]).default("standard"),
});

export const locationConfigSchema = z.object({
  buttonLabel: z.string().trim().max(40).optional(),
});

/** Dispatches to the right schema for a given block key — used by the config API route so validation stays centrally defined rather than duplicated per-route. */
export const CONFIG_SCHEMA_BY_KEY: Partial<Record<ProfileBlockKey, z.ZodTypeAny>> = {
  REVIEWS: reviewsConfigSchema,
  LOCATION: locationConfigSchema,
};

export const createBlockSchema = z.object({
  blockKey: z.nativeEnum(ProfileBlockKey),
  config: z.record(z.unknown()).default({}),
});
