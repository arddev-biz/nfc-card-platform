import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { setActiveSchema } from "@/lib/validation/profile-links";
import {
  setProfileLinkActive,
  OrganizationNotFoundError,
  ProfileLinkConflictError,
  ProfileLinkNotFoundError,
} from "@/lib/services/profile-links";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = setActiveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid value." }, { status: 400 });
  }

  try {
    const link = await setProfileLinkActive(params.id, params.linkId, parsed.data.isActive);
    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof ProfileLinkNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ProfileLinkConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while updating the link." },
      { status: 500 }
    );
  }
}
