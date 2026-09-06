import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import {
  uploadBusinessImage,
  removeBusinessImage,
  OrganizationNotFoundError,
} from "@/lib/services/business-images";
import { InvalidImageError } from "@/lib/validation/images";
import type { ImageKind } from "@/lib/validation/images";

export const runtime = "nodejs";

function parseKind(value: string): ImageKind | null {
  return value === "logo" || value === "cover" ? value : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; kind: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const kind = parseKind(params.kind);
  if (!kind) {
    return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const url = await uploadBusinessImage(params.id, kind, file);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    // Only a recognized, user-safe validation message is ever returned —
    // any other failure (e.g. a storage/network error) is logged
    // server-side and reported generically, so nothing internal leaks.
    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong uploading the image. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; kind: string } }
) {
  const admin = await getAdminApiUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const kind = parseKind(params.kind);
  if (!kind) {
    return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
  }

  try {
    await removeBusinessImage(params.id, kind);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong removing the image." },
      { status: 500 }
    );
  }
}
