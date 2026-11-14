import fs from "fs";
import path from "path";

/**
 * A post's folder name keeps only filesystem-safe characters, so a title such
 * as "CVE-2024-0517: O-CU/DU" cannot be rebuilt from it. The title exactly as
 * the author typed it lives in this file inside the post folder instead.
 */
const TITLE_FILE = "title.txt";

/**
 * The stored title, or null for posts written before title.txt existed.
 * Callers fall back to the title derived from the folder name.
 */
export function readStoredTitle(folderPath: string): string | null {
    const titlePath = path.join(folderPath, TITLE_FILE);
    if (!fs.existsSync(titlePath)) return null;

    const title = fs.readFileSync(titlePath, "utf-8").trim();
    return title || null;
}

/** Save the title as typed, on one line. */
export function writeStoredTitle(folderPath: string, title: string): void {
    const oneLine = title.replace(/\s+/g, " ").trim();
    fs.writeFileSync(path.join(folderPath, TITLE_FILE), oneLine, "utf-8");
}
