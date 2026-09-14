import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import {
  duplicateBlock,
  OrganizationNotFoundError,
  BlockNotFoundError,
  BlockOperationNotAllowedError,
} from "@/lib/services/profile-blocks";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const block = await duplicateBlock(params.id, params.blockId);
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof BlockNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BlockOperationNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong duplicating this block." },
      { status: 500 }
    );
  }
}
