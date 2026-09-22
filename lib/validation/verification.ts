import { z } from "zod";
export const verificationInput = z.object({
  verificationTooltip: z.string().trim().max(200).refine(v=>!/[<>]/.test(v),"Use plain text, not HTML.").nullable().optional(),
  isVerified: z.boolean(),
  verificationColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563EB"),
}).strict();
