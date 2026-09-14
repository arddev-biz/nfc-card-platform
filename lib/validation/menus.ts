import { z } from "zod";
import { optionalText } from "@/lib/validation/shared";
import { CURRENCY_DECIMALS } from "@/lib/currency";

export const moduleEnabledSchema = z.object({
  isEnabled: z.boolean(),
});

export const menuDetailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  description: optionalText(1000),
  isActive: z.boolean().optional(),
});

export type MenuDetailsInput = z.infer<typeof menuDetailsSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  description: optionalText(500),
  isActive: z.boolean().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const itemInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(200),
    description: optionalText(1000),
    price: z
      .number({ invalid_type_error: "Enter a valid price." })
      .positive("Price must be greater than 0.")
      .finite(),
    currency: z.enum(["ALL", "EUR"]),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const decimals = CURRENCY_DECIMALS[data.currency];
    const factor = 10 ** decimals;
    const rounded = Math.round(data.price * factor) / factor;
    if (Math.abs(rounded - data.price) > 1e-9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message:
          decimals === 0
            ? `${data.currency} doesn't use decimal amounts.`
            : `${data.currency} supports at most ${decimals} decimal place(s).`,
      });
    }
  });

export type ItemInput = z.infer<typeof itemInputSchema>;

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "Nothing to reorder."),
});
