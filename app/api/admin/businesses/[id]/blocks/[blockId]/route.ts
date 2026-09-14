import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import {
  deleteBlock,
  OrganizationNotFoundError,
  BlockNotFoundError,
  BlockOperationNotAllowedError,
} from "@/lib/services/profile-blocks";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteBlock(params.id, params.blockId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError || error instanceof BlockNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BlockOperationNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong deleting this block." },
      { status: 500 }
    );
  }
}
