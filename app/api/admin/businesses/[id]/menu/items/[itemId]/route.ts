import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { itemInputSchema } from "@/lib/validation/menus";
import {
  updateItem,
  deleteItem,
  OrganizationNotFoundError,
  MenuNotFoundError,
  ItemNotFoundError,
} from "@/lib/services/menus";

export const runtime = "nodejs";

function handleServiceError(error: unknown) {
  if (
    error instanceof OrganizationNotFoundError ||
    error instanceof MenuNotFoundError ||
    error instanceof ItemNotFoundError
  ) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const item = await updateItem(params.id, params.itemId, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteItem(params.id, params.itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error);
  }
}
