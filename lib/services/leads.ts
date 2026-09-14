import "server-only";
import { db } from "@/lib/db";
import { createOrganization } from "@/lib/services/organizations";
import type { LeadSubmissionInput } from "@/lib/validation/leads";
import type { LeadStatus } from "@prisma/client";

export class LeadNotFoundError extends Error {
  constructor() {
    super("Lead not found.");
    this.name = "LeadNotFoundError";
  }
}

export class LeadAlreadyConvertedError extends Error {
  constructor() {
    super("This lead has already been converted to a business.");
    this.name = "LeadAlreadyConvertedError";
  }
}

export async function createLead(input: LeadSubmissionInput) {
  return db.lead.create({ data: input });
}

export async function listLeads(status?: LeadStatus) {
  return db.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadById(id: string) {
  return db.lead.findUnique({
    where: { id },
    include: {
      convertedOrganization: { select: { id: true, name: true, slug: true } },
    },
  });
}

/**
 * "CONVERTED" is deliberately not settable here — that status is only
 * ever set as a side effect of convertLeadToOrganization(), which also
 * creates the actual business. Allowing it through this generic
 * endpoint would let a lead claim to be converted with no linked
 * business behind it.
 */
export async function updateLeadStatus(id: string, status: Exclude<LeadStatus, "CONVERTED">) {
  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new LeadNotFoundError();
  return db.lead.update({ where: { id }, data: { status } });
}

/**
 * Converts a Lead into a real Organization by calling the exact same
 * creation path as manual business creation (Phase 3's
 * createOrganization) — no duplicated business-creation logic, and it
 * gets the same atomic Organization+Profile+Subscription behavior for
 * free.
 *
 * The lead's own status/link update is a separate follow-up write
 * (Prisma's transaction client can't easily span two independent
 * service functions without changing createOrganization's signature,
 * which would touch approved Phase 3 code for a Phase 8 need). If that
 * follow-up write were to fail after the organization was created, the
 * organization itself is still fully valid and usable — the only
 * consequence is this lead not showing as CONVERTED, a safe and
 * visible inconsistency rather than a corrupted business record.
 *
 * Double conversion is guarded by an application-level check on the
 * lead's current state; the Convert button also disables immediately
 * on click client-side to make an accidental double-click harmless in
 * practice.
 */
export async function convertLeadToOrganization(leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new LeadNotFoundError();
  }
  if (lead.status === "CONVERTED" || lead.convertedOrganizationId) {
    throw new LeadAlreadyConvertedError();
  }

  const { organization } = await createOrganization({
    businessName: lead.businessName,
    businessType: lead.businessType ?? undefined,
    phone: lead.phone,
    email: lead.email ?? undefined,
  });

  const updatedLead = await db.lead.update({
    where: { id: leadId },
    data: { status: "CONVERTED", convertedOrganizationId: organization.id },
  });

  return { organization, lead: updatedLead };
}
