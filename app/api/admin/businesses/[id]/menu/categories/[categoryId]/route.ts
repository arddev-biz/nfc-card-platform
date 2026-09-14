import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { categoryInputSchema } from "@/lib/validation/menus";
import {
  updateCategory,
  deleteCategory,
  OrganizationNotFoundError,
  MenuNotFoundError,
  CategoryNotFoundError,
} from "@/lib/services/menus";

export const runtime = "nodejs";

function handleServiceError(error: unknown) {
  if (
    error instanceof OrganizationNotFoundError ||
    error instanceof MenuNotFoundError ||
    error instanceof CategoryNotFoundError
  ) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);

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
    const category = await updateCategory(params.id, params.categoryId, parsed.data);
    return NextResponse.json({ category });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteCategory(params.id, params.categoryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error);
  }
}
