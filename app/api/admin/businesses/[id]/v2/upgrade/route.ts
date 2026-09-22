import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { previewV2Upgrade, confirmV2Upgrade } from "@/lib/services/profile-v2-upgrade";
import { V2Error } from "@/lib/services/profile-v2";
import { z } from "zod";
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdminApiUser()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try { return NextResponse.json(await previewV2Upgrade(params.id)); }
  catch { return NextResponse.json({ error: "Unable to load conversion preview." }, { status: 400 }); }
}
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdminApiUser()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = z.object({ fingerprint: z.string().regex(/^[a-f0-9]{64}$/), confirm: z.literal(true) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  try { await confirmV2Upgrade(params.id, parsed.data.fingerprint); return NextResponse.json({ success: true }); }
  catch (e) { return NextResponse.json({ error: e instanceof V2Error ? e.message : "Conversion failed safely. Reload preview." }, { status: 409 }); }
}
