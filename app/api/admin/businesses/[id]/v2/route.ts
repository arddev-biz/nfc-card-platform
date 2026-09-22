import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { getV2Data, mutateV2, V2Error } from "@/lib/services/profile-v2";
import { v2Request } from "@/lib/profile-v2";
import { ZodError } from "zod";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdminApiUser()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ v2: await getV2Data(params.id) });
}
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const actor=await getAdminApiUser();
  if (!actor || actor.role!=="SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 100000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 100000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const { revision, command } = v2Request.parse(JSON.parse(raw));
    const v2 = await mutateV2(params.id, revision, command, actor.role);
    const profile = command.op === "info" ? await db.businessProfile.findUnique({
      where: { organizationId: params.id }, select: { phone:true,email:true,address:true,googleMapsUrl:true,whatsapp:true,website:true },
    }) : undefined;
    return NextResponse.json({ v2, profile });
  } catch (error) {
    const message = error instanceof V2Error ? error.message : error instanceof ZodError ? error.issues.map(i => i.message).join(" ") : "Unable to save. Reload and try again.";
    return NextResponse.json({ error: message }, { status: error instanceof V2Error ? 409 : 400 });
  }
}
