export const SHOWCASE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** `accept` for file input — common screenshot formats. */
export const SHOWCASE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function validateShowcaseImageFile(f: File): string | null {
  if (!f.type.startsWith("image/")) return "Please choose an image file.";
  if (f.size > SHOWCASE_IMAGE_MAX_BYTES) return "Image must be 5 MB or smaller.";
  return null;
}
