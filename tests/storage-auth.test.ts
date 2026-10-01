import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ put: vi.fn(), del: vi.fn() }));
vi.mock("@vercel/blob", () => mocks);
import { uploadImage, deleteImage } from "@/lib/storage";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("uploads to the explicitly bound public store, not the private default", async () => {
  vi.stubEnv("PUBLIC__STORE_ID", "store_public");
  vi.stubEnv("BLOB_STORE_ID", "store_private");
  mocks.put.mockResolvedValue({ url: "https://public.example/image.png" });
  const buffer = Buffer.from("test");
  expect(await uploadImage(buffer, "image.png", "image/png")).toBe("https://public.example/image.png");
  expect(mocks.put).toHaveBeenCalledWith("image.png", buffer, {
    access: "public", contentType: "image/png", addRandomSuffix: true, storeId: "store_public",
  });
});

it("deletes using the same explicit public store", async () => {
  vi.stubEnv("PUBLIC__STORE_ID", "store_public");
  vi.stubEnv("BLOB_STORE_ID", "store_private");
  await deleteImage("https://public.example/image.png");
  expect(mocks.del).toHaveBeenCalledWith("https://public.example/image.png", { storeId: "store_public" });
});

it("fails closed on Vercel when the public store binding is missing", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("PUBLIC__STORE_ID", "");
  await expect(uploadImage(Buffer.from("test"), "image.png", "image/png"))
    .rejects.toThrow("Public Blob store binding is missing.");
  expect(mocks.put).not.toHaveBeenCalled();
});
