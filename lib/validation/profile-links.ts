import { z } from "zod";
import { LinkType } from "@prisma/client";
import { PHONE_PATTERN, optionalText } from "@/lib/validation/shared";
import { LINK_TYPE_META } from "@/lib/linkTypes";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * A single flat schema (type + label + value + isActive) rather than a
 * discriminated union, matching the existing project's style (see
 * businessInputSchema). Per-type value format is enforced in
 * superRefine using the same LINK_TYPE_META used by the admin form and
 * the public profile — so adding a future link type only means adding
 * one entry there, not touching this validation logic.
 */
export const profileLinkInputSchema = z
  .object({
    type: z.nativeEnum(LinkType, {
      errorMap: () => ({ message: "Select a valid link type." }),
    }),
    label: optionalText(100),
    value: z
      .string()
      .trim()
      .min(1, "Enter a value for this link.")
      .max(500),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const meta = LINK_TYPE_META[data.type];

    if (meta.valueKind === "phone" && !PHONE_PATTERN.test(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Enter a valid phone number.",
      });
    }

    if (meta.valueKind === "email" && !EMAIL_PATTERN.test(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Enter a valid email address.",
      });
    }

    if (meta.valueKind === "url" && !isHttpUrl(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Enter a valid URL, including https://",
      });
    }
  });

export type ProfileLinkInput = z.infer<typeof profileLinkInputSchema>;

export const reorderLinksSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "No links to reorder."),
});

export type ReorderLinksInput = z.infer<typeof reorderLinksSchema>;

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});
