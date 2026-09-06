export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type ImageKind = "logo" | "cover";

interface ImageSignature {
  mime: string;
  ext: string;
  check: (buf: Buffer) => boolean;
}

const IMAGE_SIGNATURES: ImageSignature[] = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    check: (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    check: (buf) =>
      buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  },
  {
    mime: "image/webp",
    ext: "webp",
    check: (buf) =>
      buf.length > 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP",
  },
];

export class InvalidImageError extends Error {}

/** Throws InvalidImageError with a user-safe message if the buffer isn't an accepted image type/size. */
export function assertValidImage(buffer: Buffer): { mime: string; ext: string } {
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new InvalidImageError("Image must be 5MB or smaller.");
  }

  const match = IMAGE_SIGNATURES.find((entry) => entry.check(buffer));
  if (!match) {
    throw new InvalidImageError("Only JPEG, PNG, and WebP images are supported.");
  }

  return { mime: match.mime, ext: match.ext };
}
