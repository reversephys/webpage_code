/**
 * Helpers for turning the first lines of a markdown post into a list excerpt.
 * Shared by the blog, notice and staff post loaders.
 */

/**
 * Drop inline markdown syntax so an excerpt reads as plain text:
 * `code` → code, **bold** → bold, [label](url) → label.
 */
export function stripInlineMarkdown(text: string): string {
    return text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")       // inline images
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")    // links keep their label
        .replace(/(\*\*|__|~~)(.+?)\1/g, "$2")      // bold, strikethrough
        .replace(/\*(.+?)\*/g, "$1")                // italic
        .replace(/`([^`]*)`/g, "$1")                // inline code
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Split text into sentences. A sentence ends at . ! ? only when whitespace or
 * the end of the text follows, so "Open5GS 2.7.6" and "/dev/cu.usbserial"
 * are not cut in the middle.
 */
export function splitSentences(text: string): string[] | null {
    const sentences = text.match(/.+?[.!?]+(?=\s|$)/g);
    return sentences ? sentences.map((s) => s.trim()) : null;
}
