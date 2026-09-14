import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { blockVisibilitySchema } from "@/lib/validation/profile-blocks";
import {
  setBlockVisibility,
  OrganizationNotFoundError,
  BlockNotFoundError,
} from "@/lib/services/profile-blocks";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = blockVisibilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid value." }, { status: 400 });
  }

  try {
    const block = await setBlockVisibility(params.id, params.blockId, parsed.data.isVisible);
    return NextResponse.json({ block });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof BlockNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong updating this block." },
      { status: 500 }
    );
  }
}
