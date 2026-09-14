import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { blockReorderSchema } from "@/lib/validation/profile-blocks";
import {
  reorderBlockLayout,
  OrganizationNotFoundError,
  BlockOperationNotAllowedError,
} from "@/lib/services/profile-blocks";

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
  const parsed = blockReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  try {
    await reorderBlockLayout(params.id, parsed.data.orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BlockOperationNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong reordering blocks." },
      { status: 500 }
    );
  }
}
