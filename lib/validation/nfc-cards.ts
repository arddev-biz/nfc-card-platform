import { z } from "zod";

/**
 * UNASSIGNED is deliberately excluded — it's an internal state for
 * future pre-provisioned inventory, not something the admin sets
 * manually from a business's card list in V1.
 */
export const cardStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "REPLACED"]),
});

export const cardReassignSchema = z.object({
  destinationOrganizationId: z.string().min(1, "Select a destination business."),
});
