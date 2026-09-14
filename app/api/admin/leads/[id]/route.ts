import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { getLeadById } from "@/lib/services/leads";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const lead = await getLeadById(params.id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
