import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { createBlockSchema, CONFIG_SCHEMA_BY_KEY } from "@/lib/validation/profile-blocks";
import {
  createCustomBlock,
  OrganizationNotFoundError,
  BlockOperationNotAllowedError,
} from "@/lib/services/profile-blocks";

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
  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid block." }, { status: 400 });
  }

  // Re-validate config against this specific block type's real schema —
  // createBlockSchema only checks it's a generic object.
  const configSchema = CONFIG_SCHEMA_BY_KEY[parsed.data.blockKey];
  const configParsed = configSchema
    ? configSchema.safeParse(parsed.data.config)
    : { success: true as const, data: {} };

  if (!configParsed.success) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted fields.",
        fieldErrors: configParsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const block = await createCustomBlock(params.id, parsed.data.blockKey, configParsed.data);
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BlockOperationNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong adding this block." },
      { status: 500 }
    );
  }
}
