import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { reorderSchema } from "@/lib/validation/menus";
import {
  reorderItems,
  OrganizationNotFoundError,
  MenuNotFoundError,
  CategoryNotFoundError,
} from "@/lib/services/menus";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
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
    const success = await reorderItems(params.id, params.categoryId, parsed.data.orderedIds);
    if (!success) {
      return NextResponse.json(
        { error: "The provided order doesn't match this category's items." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof OrganizationNotFoundError ||
      error instanceof MenuNotFoundError ||
      error instanceof CategoryNotFoundError
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while reordering items." },
      { status: 500 }
    );
  }
}
