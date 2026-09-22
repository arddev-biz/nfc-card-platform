import { NextRequest, NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { assertValidImage, MAX_IMAGE_SIZE_BYTES } from "@/lib/validation/images";
import { uploadImage, deleteImage } from "@/lib/storage";
import { randomUUID } from "crypto";
export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdminApiUser()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const p = await db.businessProfile.findUnique({ where: { organizationId: params.id }, select: { id: true, builderVersion: true } });
  if (!p || p.builderVersion !== 2) return NextResponse.json({ error: "V2 profile required." }, { status: 404 });
  let uploaded: string | null = null;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing upload.");
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.byteLength;
      if (length > MAX_IMAGE_SIZE_BYTES + 65536) { await reader.cancel(); throw new Error("Image must be 5MB or smaller."); }
      chunks.push(part.value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file");
    if (!file || typeof file === "string") throw new Error("Choose an image.");
    const buffer = Buffer.from(await file.arrayBuffer()), meta = assertValidImage(buffer);
    const path = `profiles/${p.id}/v2/${randomUUID()}.${meta.ext}`;
    uploaded = await uploadImage(buffer, path, meta.mime);
    const asset = await db.profileAsset.create({ data: { businessProfileId: p.id, url: uploaded,
      pathname: new URL(uploaded).pathname, mimeType: meta.mime, byteSize: buffer.length } });
    return NextResponse.json({ asset: { id: asset.id, url: asset.url } });
  } catch {
    if (uploaded) await deleteImage(uploaded);
    return NextResponse.json({ error: "Upload failed. Use JPEG, PNG or WebP up to 5MB." }, { status: 400 });
  }
}
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdminApiUser()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const assetId = request.nextUrl.searchParams.get("assetId");
  if (!assetId) return NextResponse.json({ error: "Missing asset." }, { status: 400 });
  const removed = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "organizationId" = ${params.id} FOR UPDATE`;
    const asset = await tx.profileAsset.findFirst({ where: { id: assetId, businessProfile: { organizationId: params.id } },
      include: { _count: { select: { images: true, linkIcons: true } } } });
    if (!asset || asset._count.images || asset._count.linkIcons) return null;
    await tx.profileAsset.delete({ where: { id: asset.id } });
    return asset.url;
  });
  if (removed) await deleteImage(removed);
  return NextResponse.json({ removed: !!removed });
}
