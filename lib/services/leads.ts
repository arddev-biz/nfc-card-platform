import "server-only";
import { db } from "@/lib/db";
import { createOrganizationInTransaction } from "@/lib/services/organizations";
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
 * Converts and links a lead in one transaction using the same
 * organization-creation implementation as the manual flow. The
 * conditional update claims the lead row, so concurrent attempts cannot
 * both create an organization. Any later failure rolls the claim and all
 * newly-created records back together.
 */
export async function convertLeadToOrganization(leadId: string) {
  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new LeadNotFoundError();
    }

    const claimed = await tx.lead.updateMany({
      where: {
        id: leadId,
        status: { not: "CONVERTED" },
        convertedOrganizationId: null,
      },
      data: { status: "CONVERTED" },
    });
    if (claimed.count !== 1) {
      throw new LeadAlreadyConvertedError();
    }

    const { organization } = await createOrganizationInTransaction(tx, {
      businessName: lead.businessName,
      businessType: lead.businessType ?? undefined,
      phone: lead.phone,
      email: lead.email ?? undefined,
    });

    const updatedLead = await tx.lead.update({
      where: { id: leadId },
      data: { convertedOrganizationId: organization.id },
    });

    return { organization, lead: updatedLead };
  });
}
