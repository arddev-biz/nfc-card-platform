import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { categoryInputSchema } from "@/lib/validation/menus";
import {
  createCategory,
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
    const category = await createCategory(params.id, parsed.data);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof MenuNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating the category." },
      { status: 500 }
    );
  }
}
