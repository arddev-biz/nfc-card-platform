import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { cardStatusUpdateSchema } from "@/lib/validation/nfc-cards";
import {
  setCardStatus,
  OrganizationNotFoundError,
  CardNotFoundError,
  CardStatusConflictError,
} from "@/lib/services/nfc-cards";

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
  const parsed = cardStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  try {
    const card = await setCardStatus(params.id, params.cardId, parsed.data.status);
    return NextResponse.json({ card });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof CardNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof CardStatusConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while updating the card." },
      { status: 500 }
    );
  }
}
