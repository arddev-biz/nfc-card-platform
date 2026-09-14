import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { z } from "zod";
import { updateLeadStatus, LeadNotFoundError } from "@/lib/services/leads";

export const runtime = "nodejs";

// CONVERTED deliberately excluded — only /convert may set that status,
// since it also has to create the actual business.
const statusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status. Use the convert action to mark a lead as converted." },
      { status: 400 }
    );
  }

  try {
    const lead = await updateLeadStatus(params.id, parsed.data.status);
    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof LeadNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong updating the lead." },
      { status: 500 }
    );
  }
}
