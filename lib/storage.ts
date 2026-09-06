import "server-only";
import { put, del } from "@vercel/blob";

export async function uploadImage(
  buffer: Buffer,
  pathname: string,
  contentType: string
): Promise<string> {
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}

/**
 * Best-effort delete — deliberately swallows errors. A failed cleanup of
 * an old/removed image must never undo the caller's already-successful
 * upload or database update (see lib/services/business-images.ts).
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete blob:", error);
  }
}
