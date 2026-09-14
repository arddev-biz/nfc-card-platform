import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { setActiveSchema } from "@/lib/validation/menus";
import {
  setCategoryActive,
  OrganizationNotFoundError,
  MenuNotFoundError,
  CategoryNotFoundError,
} from "@/lib/services/menus";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
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
    const category = await setCategoryActive(params.id, params.categoryId, parsed.data.isActive);
    return NextResponse.json({ category });
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
      { error: "Something went wrong while updating the category." },
      { status: 500 }
    );
  }
}
