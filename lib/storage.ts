import "server-only";
import { put, del } from "@vercel/blob";

function publicStoreOptions() {
  const storeId = process.env.PUBLIC__STORE_ID?.trim();
  if (!storeId && process.env.VERCEL) {
    throw new Error("Public Blob store binding is missing.");
  }
  return storeId ? { storeId } : {};
}

export async function uploadImage(
  buffer: Buffer,
  pathname: string,
  contentType: string
): Promise<string> {
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
    ...publicStoreOptions(),
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
    await del(url, publicStoreOptions());
  } catch (error) {
    console.error("Failed to delete blob:", error);
  }
}
