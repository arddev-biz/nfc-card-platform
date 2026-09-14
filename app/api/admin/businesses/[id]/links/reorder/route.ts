import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { reorderLinksSchema } from "@/lib/validation/profile-links";
import {
  reorderProfileLinks,
  OrganizationNotFoundError,
  ProfileLinkNotFoundError,
} from "@/lib/services/profile-links";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderLinksSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  try {
    const links = await reorderProfileLinks(params.id, parsed.data.orderedIds);
    return NextResponse.json({ links });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ProfileLinkNotFoundError) {
      return NextResponse.json(
        { error: "The provided order doesn't match this business's links." },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while reordering links." },
      { status: 500 }
    );
  }
}
