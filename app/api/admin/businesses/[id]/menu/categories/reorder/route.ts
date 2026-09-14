import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { reorderSchema } from "@/lib/validation/menus";
import {
  reorderCategories,
  OrganizationNotFoundError,
  MenuNotFoundError,
} from "@/lib/services/menus";

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
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  try {
    const success = await reorderCategories(params.id, parsed.data.orderedIds);
    if (!success) {
      return NextResponse.json(
        { error: "The provided order doesn't match this menu's categories." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof MenuNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while reordering categories." },
      { status: 500 }
    );
  }
}
