import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { moduleEnabledSchema } from "@/lib/validation/menus";
import { setMenuModuleEnabled, OrganizationNotFoundError } from "@/lib/services/menus";

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
  const parsed = moduleEnabledSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid value." }, { status: 400 });
  }

  try {
    const businessModule = await setMenuModuleEnabled(params.id, parsed.data.isEnabled);
    return NextResponse.json({ module: businessModule });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while updating the Menu module." },
      { status: 500 }
    );
  }
}
