import { fileTypeFromBuffer } from "file-type";

export const ALLOWED_IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
export const ALLOWED_IMAGE_MIME = new Set([
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
]);

export function getValidatedExt(filename: string): string | null {
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return null;
    const ext = filename.slice(dot).toLowerCase();
    return ALLOWED_IMAGE_EXT.has(ext) ? ext : null;
}

export async function isAllowedImageBuffer(buffer: Buffer): Promise<boolean> {
    const detected = await fileTypeFromBuffer(buffer);
    return !!detected && ALLOWED_IMAGE_MIME.has(detected.mime);
}
