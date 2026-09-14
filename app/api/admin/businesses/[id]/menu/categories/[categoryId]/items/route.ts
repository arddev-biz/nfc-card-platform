import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { itemInputSchema } from "@/lib/validation/menus";
import {
  createItem,
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
  const parsed = itemInputSchema.safeParse(body);

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
    const item = await createItem(params.id, params.categoryId, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
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
      { error: "Something went wrong while creating the item." },
      { status: 500 }
    );
  }
}
