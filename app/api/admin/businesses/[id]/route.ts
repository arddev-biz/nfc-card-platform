import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { businessInputSchema } from "@/lib/validation/business";
import { getOrganizationById, updateOrganization, SlugTakenError, isSlugUniqueConstraintError } from "@/lib/services/organizations";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const organization = await getOrganizationById(params.id);
  if (!organization) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  return NextResponse.json({ organization });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = businessInputSchema.safeParse(body);

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
    const result = await updateOrganization(params.id, parsed.data);
    if (!result) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }
    return NextResponse.json({ organization: result.organization });
  } catch (error) {
    if (error instanceof SlugTakenError || isSlugUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          error: "That slug is already in use.",
          fieldErrors: { slug: ["This slug is already taken. Choose another."] },
        },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while updating the business." },
      { status: 500 }
    );
  }
}
