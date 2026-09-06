import { z } from "zod";
import { emptyToUndefined, optionalText, PHONE_PATTERN } from "@/lib/validation/shared";

export const leadSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(200),
  businessName: z.string().trim().min(2, "Business name is required.").max(200),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Enter a valid phone number.")
    .max(30),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Enter a valid email address.").max(200).optional()
  ),
  businessType: optionalText(100),
  message: optionalText(2000),
});

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;

export const leadStatusUpdateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]),
});
