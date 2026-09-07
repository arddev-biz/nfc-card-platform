import "server-only";
import { db } from "@/lib/db";
import { uploadImage, deleteImage } from "@/lib/storage";
import { assertValidImage, type ImageKind } from "@/lib/validation/images";

export class OrganizationNotFoundError extends Error {
  constructor() {
    super("Business not found.");
    this.name = "OrganizationNotFoundError";
  }
}

async function getOwnedProfile(organizationId: string) {
  const profile = await db.businessProfile.findUnique({ where: { organizationId } });
  if (!profile) {
    throw new OrganizationNotFoundError();
  }
  return profile;
}

const PROFILE_FIELD_BY_KIND = {
  logo: "logoUrl",
  cover: "coverImageUrl",
  background: "backgroundImageUrl",
} as const;

export async function uploadBusinessImage(
  organizationId: string,
  kind: ImageKind,
  file: File
): Promise<string> {
  const profile = await getOwnedProfile(organizationId);

  const buffer = Buffer.from(await file.arrayBuffer());
  const { mime, ext } = assertValidImage(buffer); // throws InvalidImageError on bad type/size

  const pathname = `businesses/${organizationId}/${kind}.${ext}`;
  const url = await uploadImage(buffer, pathname, mime);

  const field = PROFILE_FIELD_BY_KIND[kind];
  const previousUrl = profile[field];

  await db.businessProfile.update({
    where: { organizationId },
    data: { [field]: url },
  });

  // Upload + DB update already succeeded by this point. Cleaning up the
  // old image is best-effort and must never undo that success.
  if (previousUrl && previousUrl !== url) {
    await deleteImage(previousUrl);
  }

  return url;
}

export async function removeBusinessImage(organizationId: string, kind: ImageKind): Promise<void> {
  const profile = await getOwnedProfile(organizationId);
  const field = PROFILE_FIELD_BY_KIND[kind];
  const previousUrl = profile[field];

  await db.businessProfile.update({
    where: { organizationId },
    data: { [field]: null },
  });

  if (previousUrl) {
    await deleteImage(previousUrl);
  }
}
