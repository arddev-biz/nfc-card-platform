import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { cardReassignSchema } from "@/lib/validation/nfc-cards";
import { reassignCard, OrganizationNotFoundError, CardNotFoundError } from "@/lib/services/nfc-cards";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; cardId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = cardReassignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Select a valid destination business." },
      { status: 400 }
    );
  }

  try {
    const card = await reassignCard(params.id, params.cardId, parsed.data.destinationOrganizationId);
    return NextResponse.json({ card });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof CardNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while reassigning the card." },
      { status: 500 }
    );
  }
}
