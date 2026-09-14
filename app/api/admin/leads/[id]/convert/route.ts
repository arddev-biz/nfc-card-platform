import { NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import {
  convertLeadToOrganization,
  LeadNotFoundError,
  LeadAlreadyConvertedError,
} from "@/lib/services/leads";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await convertLeadToOrganization(params.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof LeadNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof LeadAlreadyConvertedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong converting this lead." },
      { status: 500 }
    );
  }
}
