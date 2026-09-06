import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { getCard, OrganizationNotFoundError, CardNotFoundError } from "@/lib/services/nfc-cards";

export const runtime = "nodejs";

// Deliberately no DELETE handler: NFC cards represent physical products.
// Losing the record on delete would make future support/debugging
// impossible, so the only supported lifecycle is status changes
// (see the status/ sub-route) — never physical deletion.

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; cardId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const card = await getCard(params.id, params.cardId);
    return NextResponse.json({ card });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof CardNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
