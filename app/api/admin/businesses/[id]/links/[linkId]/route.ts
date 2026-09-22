import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { profileLinkInputSchema } from "@/lib/validation/profile-links";
import {
  deleteProfileLink,
  getProfileLink,
  updateProfileLink,
  OrganizationNotFoundError,
  ProfileLinkConflictError,
  ProfileLinkNotFoundError,
} from "@/lib/services/profile-links";

export const runtime = "nodejs";

function handleServiceError(error: unknown) {
  if (error instanceof OrganizationNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ProfileLinkNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ProfileLinkConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong." },
    { status: 500 }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const link = await getProfileLink(params.id, params.linkId);
    return NextResponse.json({ link });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
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
    const link = await updateProfileLink(params.id, params.linkId, parsed.data);
    return NextResponse.json({ link });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteProfileLink(params.id, params.linkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error);
  }
}
