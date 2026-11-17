/**
 * Pure helpers shared by the post write pages (blog, notice, staff) and the
 * blog routes. No React and no Node APIs, so both sides can import it.
 */

// Image types the server accepts, and the extension each is saved under.
const IMAGE_EXT_BY_TYPE: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
};

/**
 * The list thumbnail an author picked is kept beside the body images under a
 * name of its own. The name changes on every upload, so a replaced thumbnail
 * is never served from an image cache.
 */
export function thumbnailFilename(ext: string): string {
    return `thumbnail-${Date.now().toString(36)}${ext}`;
}

export function isThumbnailFile(filename: string): boolean {
    return /^thumbnail(-[a-z0-9]+)?\.(png|jpe?g|gif|webp)$/i.test(filename);
}

export function isSupportedImage(file: File): boolean {
    return file.type in IMAGE_EXT_BY_TYPE;
}

/**
 * Copies of the given images under unique names. Clipboard images all arrive
 * as "image.png", and the server matches a reference to its file by name.
 */
export function nameImages(files: File[]): File[] {
    const stamp = Date.now().toString(36);
    return files.filter(isSupportedImage).map((file, i) =>
        new File([file], `image-${stamp}-${i + 1}.${IMAGE_EXT_BY_TYPE[file.type]}`, { type: file.type })
    );
}

/**
 * Names of the images a markdown body points at as `images/<name>`. Same
 * pattern the post pages use to turn those references into image URLs.
 */
export function referencedImages(markdown: string): Set<string> {
    const names = new Set<string>();
    for (const match of markdown.matchAll(/!\[[^\]]*\]\(images\/([^)]+)\)/g)) {
        names.add(match[1]);
    }
    return names;
}

/**
 * The notice and staff post APIs return the body with its `images/<name>`
 * references already turned into image URLs. Put the references back for
 * editing, so that saving does not write those URLs into the post.
 */
export function restoreImageRefs(markdown: string, images: { name: string; url: string }[]): string {
    return images.reduce(
        (text, img) => text.split(`](${img.url})`).join(`](images/${img.name})`),
        markdown
    );
}

const isPublicTag = (tag: string) => tag.toLowerCase() === "public";

export function splitTags(value: string): string[] {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

/** Split a stored tag string into the visibility flag and the tags the author typed. */
export function parseTags(value: string): { isPublic: boolean; tags: string[] } {
    const all = splitTags(value);
    return { isPublic: all.some(isPublicTag), tags: all.filter((tag) => !isPublicTag(tag)) };
}

/**
 * Tags to save. Visibility is chosen with the Public / Private buttons and
 * stored as the `public` tag; a `public` typed into the tag field still counts.
 */
export function buildTags(tagInput: string, isPublic: boolean): string[] {
    const typed = parseTags(tagInput);
    return isPublic || typed.isPublic ? ["public", ...typed.tags] : typed.tags;
}
