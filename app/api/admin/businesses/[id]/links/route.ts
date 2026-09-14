import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { profileLinkInputSchema } from "@/lib/validation/profile-links";
import {
  createProfileLink,
  listProfileLinks,
  OrganizationNotFoundError,
} from "@/lib/services/profile-links";

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
    const links = await listProfileLinks(params.id);
    return NextResponse.json({ links });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading links." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileLinkInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const link = await createProfileLink(params.id, parsed.data);
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating the link." },
      { status: 500 }
    );
  }
}
