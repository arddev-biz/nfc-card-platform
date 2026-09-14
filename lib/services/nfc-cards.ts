import "server-only";
import { randomBytes } from "crypto";
import { Prisma, CardStatus } from "@prisma/client";
import { db } from "@/lib/db";

export class OrganizationNotFoundError extends Error {
  constructor() {
    super("Business not found.");
    this.name = "OrganizationNotFoundError";
  }
}

export class CardNotFoundError extends Error {
  constructor() {
    super("Card not found.");
    this.name = "CardNotFoundError";
  }
}

/** True if a Prisma unique-constraint violation (P2002) was on the NFCCard `token` field. */
function isTokenUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta?.target as string[]).includes("token")
  );
}

/**
 * 24 random bytes (192 bits) as hex — the same technique already used
 * for session tokens (see lib/auth/session.ts), just longer, since this
 * token is the sole public identifier for a physical card and must be
 * unguessable. Never derived from any business/database ID, slug, or
 * timestamp.
 */
function generateCardToken(): string {
  return randomBytes(24).toString("hex");
}

async function organizationExists(organizationId: string): Promise<boolean> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  return Boolean(org);
}

export async function listCardsForOrganization(organizationId: string) {
  if (!(await organizationExists(organizationId))) {
    throw new OrganizationNotFoundError();
  }

  return db.nFCCard.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Creates a card already assigned to `organizationId` with an
 * immediately ACTIVE status — this is the simplified V1 flow (cards are
 * created from within a specific business's page, not pre-provisioned
 * as anonymous inventory). The schema's nullable `organizationId` still
 * supports a future bulk-provisioning feature without another migration.
 *
 * Retries token generation on the extraordinarily unlikely event of a
 * collision, both via a pre-check and a Prisma P2002 catch as a second
 * line of defense — the database's unique constraint is the real
 * guarantee either way.
 */
export async function createCardForOrganization(organizationId: string) {
  if (!(await organizationExists(organizationId))) {
    throw new OrganizationNotFoundError();
  }

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const token = generateCardToken();
    try {
      return await db.nFCCard.create({
        data: {
          token,
          organizationId,
          status: "ACTIVE",
          activatedAt: new Date(),
        },
      });
    } catch (error) {
      if (isTokenUniqueConstraintError(error) && attempt < MAX_ATTEMPTS - 1) {
        continue; // extraordinarily unlikely; try again with a fresh token
      }
      throw error;
    }
  }

  // Unreachable in practice, but keeps the function's return type honest.
  throw new Error("Could not generate a unique NFC token after several attempts.");
}

/** Fetches a card only if it belongs to the given organization — the ownership guard against IDOR. */
async function findOwnedCard(organizationId: string, cardId: string) {
  if (!(await organizationExists(organizationId))) {
    throw new OrganizationNotFoundError();
  }

  const card = await db.nFCCard.findFirst({
    where: { id: cardId, organizationId },
  });

  if (!card) {
    throw new CardNotFoundError();
  }

  return card;
}

export async function getCard(organizationId: string, cardId: string) {
  return findOwnedCard(organizationId, cardId);
}

export async function setCardStatus(
  organizationId: string,
  cardId: string,
  status: CardStatus
) {
  const existing = await findOwnedCard(organizationId, cardId);

  return db.nFCCard.update({
    where: { id: existing.id },
    data: {
      status,
      // Set activatedAt the first time a card actually becomes active;
      // never overwritten on later reactivations, so it reflects the
      // card's original activation, not its most recent one.
      activatedAt: status === "ACTIVE" && !existing.activatedAt ? new Date() : undefined,
    },
  });
}

/**
 * Moves a card to a different organization. The token, id, and
 * createdAt are untouched — the same physical card keeps working at
 * the same /c/[token] URL, now pointing at a different business.
 */
export async function reassignCard(
  organizationId: string,
  cardId: string,
  destinationOrganizationId: string
) {
  const existing = await findOwnedCard(organizationId, cardId);

  if (!(await organizationExists(destinationOrganizationId))) {
    throw new OrganizationNotFoundError();
  }

  return db.nFCCard.update({
    where: { id: existing.id },
    data: { organizationId: destinationOrganizationId },
  });
}

/**
 * Public lookup for the /c/[cardToken] resolver. Deliberately returns
 * only what's needed to decide whether to even attempt a redirect
 * (the card's own status and the organization's slug) — no card id, no
 * organization id. Whether the organization itself is publicly visible
 * is NOT re-checked here; the redirect route reuses
 * getPublicBusinessProfile() for that, so there is exactly one place
 * that defines "is this business public" (see lib/services/public-profile.ts).
 */
export async function getCardForRedirect(token: string) {
  return db.nFCCard.findUnique({
    where: { token },
    select: {
      status: true,
      organization: {
        select: { slug: true },
      },
    },
  });
}
