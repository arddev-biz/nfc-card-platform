import { z } from "zod";
import {badgeVariants} from "../badge-styles";
export const verificationInput = z.object({
  verificationBadge: z.enum(badgeVariants).optional(),
  verificationBadgeSize: z.number().min(16).max(40).optional(),
  verificationTooltip: z.string().trim().max(200).refine(v=>!/[<>]/.test(v),"Use plain text, not HTML.").nullable().optional(),
  isVerified: z.boolean(),
  verificationColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563EB"),
}).strict();
