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
  let stage = "request-body";
  let imageMetadata: { mimeType: string; byteSize: number; extension: string } | null = null;
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
    stage = "multipart-parse";
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file");
    if (!file || typeof file === "string") throw new Error("Choose an image.");
    stage = "image-validation";
    const buffer = Buffer.from(await file.arrayBuffer()), meta = assertValidImage(buffer);
    imageMetadata = { mimeType: meta.mime, byteSize: buffer.length, extension: meta.ext };
    const path = `profiles/${p.id}/v2/${randomUUID()}.${meta.ext}`;
    stage = "blob-put";
    uploaded = await uploadImage(buffer, path, meta.mime);
    stage = "asset-record";
    const asset = await db.profileAsset.create({ data: { businessProfileId: p.id, url: uploaded,
      pathname: new URL(uploaded).pathname, mimeType: meta.mime, byteSize: buffer.length } });
    return NextResponse.json({ asset: { id: asset.id, url: asset.url } });
  } catch (error) {
    // Never log the exception object/stack: it may contain request or database data.
    let message = error instanceof Error ? error.message : "Non-Error exception";
    for (const value of Object.values(process.env)) {
      if (value && value.length >= 8) message = message.split(value).join("[redacted]");
    }
    message = message.replace(/(?:https?:\/\/|postgres(?:ql)?:\/\/)[^\s]+/gi, "[redacted URL]")
      .replace(/vercel_blob_[^\s"']+/gi, "[redacted token]")
      .replace(/(authorization|cookie|token|password|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]");
    console.error("Profile image upload failed", {
      route: "/api/admin/businesses/[id]/v2/assets", authenticated: true, status: 400,
      stage, ...imageMetadata,
      errorType: error instanceof Error ? error.name : "Unknown",
      errorMessage: stage === "asset-record" ? "Asset record operation failed" : message.slice(0, 600),
    });
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
