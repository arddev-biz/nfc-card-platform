import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { CONFIG_SCHEMA_BY_KEY } from "@/lib/validation/profile-blocks";
import {
  updateBlockConfig,
  OrganizationNotFoundError,
  BlockNotFoundError,
} from "@/lib/services/profile-blocks";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // The config schema depends on which block this row actually is — look
  // it up first rather than trusting a client-supplied type.
  const row = await db.profileBlockLayout.findUnique({ where: { id: params.blockId } });
  if (!row) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  const schema = CONFIG_SCHEMA_BY_KEY[row.blockKey];
  if (!schema) {
    return NextResponse.json(
      { error: "This block type has no editable settings." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
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
    const block = await updateBlockConfig(params.id, params.blockId, parsed.data);
    return NextResponse.json({ block });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof BlockNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong saving this block." },
      { status: 500 }
    );
  }
}
