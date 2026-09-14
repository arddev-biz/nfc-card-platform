import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { statusUpdateSchema } from "@/lib/validation/business";
import { setOrganizationStatus } from "@/lib/services/organizations";

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
  const parsed = statusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status value." },
      { status: 400 }
    );
  }

  try {
    const organization = await setOrganizationStatus(params.id, parsed.data.status);
    if (!organization) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }
    return NextResponse.json({ organization });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while updating the business status." },
      { status: 500 }
    );
  }
}
