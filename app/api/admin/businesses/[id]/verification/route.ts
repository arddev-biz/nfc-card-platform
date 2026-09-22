import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { updateVerification } from "@/lib/services/verification";
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminApiUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 1000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const verification = await updateVerification(params.id, JSON.parse(raw));
    return NextResponse.json({ verification });
  } catch {
    return NextResponse.json({ error: "Unable to save verification. Check the business and badge color." }, { status: 400 });
  }
}
