import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { profileContentUpdateSchema } from "@/lib/validation/profile-content";
import { updateProfileContentFields } from "@/lib/services/organizations";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileContentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const profile = await updateProfileContentFields(params.id, parsed.data);
  if (!profile) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
