import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import {
  createCardForOrganization,
  listCardsForOrganization,
  OrganizationNotFoundError,
} from "@/lib/services/nfc-cards";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const cards = await listCardsForOrganization(params.id);
    return NextResponse.json({ cards });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading cards." },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // No request body is read: the token is always server-generated and
  // never trusted from the client (see lib/services/nfc-cards.ts).
  try {
    const card = await createCardForOrganization(params.id);
    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating the card." },
      { status: 500 }
    );
  }
}
