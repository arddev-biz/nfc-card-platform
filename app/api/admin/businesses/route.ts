import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { businessInputSchema } from "@/lib/validation/business";
import { createOrganization, listOrganizations, SlugTakenError, isSlugUniqueConstraintError } from "@/lib/services/organizations";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const organizations = await listOrganizations();
  return NextResponse.json({ organizations });
}

export async function POST(request: NextRequest) {
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
    const { organization } = await createOrganization(parsed.data);
    return NextResponse.json({ organization }, { status: 201 });
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
      { error: "Something went wrong while creating the business." },
      { status: 500 }
    );
  }
}
