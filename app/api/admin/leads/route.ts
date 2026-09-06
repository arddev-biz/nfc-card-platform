import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { listLeads } from "@/lib/services/leads";
import type { LeadStatus } from "@prisma/client";

export const runtime = "nodejs";

const VALID_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

export async function GET(request: NextRequest) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as LeadStatus)
      ? (statusParam as LeadStatus)
      : undefined;

  const leads = await listLeads(status);
  return NextResponse.json({ leads });
}
