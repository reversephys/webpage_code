import fs from "fs";
import path from "path";
import { getTagsForPosts } from "./tags";

export interface BlogPost {
    slug: string;
    title: string;
    date: string;        // formatted date string e.g. "Feb 10, 2026"
    rawDate: string;     // yyyymmdd
    tag: string;         // Primary tag or comma-separated tags
    userId: string;
    excerpt: string;
    thumbnail: string | null;  // API route path to thumbnail image
    content?: string;    // full MD content (only in detail view)
    authorName?: string;
}

const CONTENTS_DIR = path.join(process.cwd(), "..", "Contents", "BLOG");

/**
 * Parse folder name: {yyyymmdd}_{title}_{tag}
 */
function parseFolderName(folderName: string): { rawDate: string; userId: string; title: string; tag: string } | null {
    const parts = folderName.split('_');
    if (parts.length === 4) {
        return { rawDate: parts[0], userId: parts[1], tag: parts[2], title: parts[3] };
    }
    if (parts.length === 3) {
        return { rawDate: parts[0], userId: "", tag: parts[1], title: parts[2] };
    }
    return null;
}

/**
 * Format yyyymmdd ??"Feb 10, 2026"
 */
function formatDate(raw: string): string {
    const year = raw.slice(0, 4);
    const month = parseInt(raw.slice(4, 6), 10) - 1;
    const day = parseInt(raw.slice(6, 8), 10);
    // Optional: parse time if needed, but for now just showing date
    const date = new Date(parseInt(year), month, day);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Extract excerpt from MD content:
 * - Skip lines starting with # (headings)
 * - Skip empty lines
 * - Find first non-heading paragraph text
 * - Return 1-2 sentences (short ??2 sentences, long ??1 sentence)
 */
function extractExcerpt(content: string): string {
    const lines = content.split("\n");
    const bodyLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        // Skip headings, empty lines, images, code blocks
        if (
            trimmed.startsWith("#") ||
            trimmed === "" ||
            trimmed.startsWith("![") ||
            trimmed.startsWith("```") ||
            trimmed.startsWith("- ") ||
            trimmed.startsWith("| ") ||
            trimmed.startsWith("> ")
        ) {
            continue;
        }
        bodyLines.push(trimmed);
        if (bodyLines.length >= 2) break;
    }

    if (bodyLines.length === 0) return "";

    const fullText = bodyLines.join(" ");

    // Split by sentence endings
    const sentences = fullText.match(/[^.!?]+[.!?]+/g);
    if (!sentences) return fullText.slice(0, 200);

    // If first sentence is long (> 100 chars), return just 1
    if (sentences[0].length > 100) {
        return sentences[0].trim();
    }

    // Otherwise return up to 2 sentences
    return sentences.slice(0, 2).join(" ").trim();
}

/**
 * Read the original title from title.txt if present.
 * Posts created before title.txt was introduced fall back to the
 * folder-name-derived title (which strips special characters).
 */
function readStoredTitle(folderPath: string): string | null {
    const titlePath = path.join(folderPath, "title.txt");
    if (!fs.existsSync(titlePath)) return null;
    const title = fs.readFileSync(titlePath, "utf-8").trim();
    return title || null;
}

/**
 * Find first image in the images/ subdirectory
 */
function findThumbnail(folderPath: string, slug: string): string | null {
    const imagesDir = path.join(folderPath, "images");
    if (!fs.existsSync(imagesDir)) return null;

    const files = fs.readdirSync(imagesDir);
    const imageFile = files.find((f) =>
        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f)
    );

    if (!imageFile) return null;
    return `/api/blog-image/${slug}/${imageFile}`;
}

/**
 * Get all blog posts, sorted by date descending
 */
export async function getAllPosts(): Promise<BlogPost[]> {
    if (!fs.existsSync(CONTENTS_DIR)) return [];

    const folders = fs.readdirSync(CONTENTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("_"));

    const postMap = new Map<string, BlogPost>();

    for (const folder of folders) {
        const parsed = parseFolderName(folder.name);
        if (!parsed) continue;

        const folderPath = path.join(CONTENTS_DIR, folder.name);

        // Find the .md file inside the folder
        const files = fs.readdirSync(folderPath);
        const mdFile = files.find((f) => f.endsWith(".md"));
        if (!mdFile) continue;

        const mdPath = path.join(folderPath, mdFile);
        const content = fs.readFileSync(mdPath, "utf-8");

        const slug = mdFile.replace(/\.md$/, "");
        const thumbnail = findThumbnail(folderPath, slug);
        const excerpt = extractExcerpt(content);

        const post: BlogPost = {
            slug,
            title: readStoredTitle(folderPath) ?? parsed.title.replace(/-/g, " "),
            date: formatDate(parsed.rawDate),
            rawDate: parsed.rawDate,
            tag: parsed.tag,
            userId: parsed.userId,
            excerpt,
            thumbnail,
        };

        // If duplicate slug found, keep the one with the newer folder name (timestamp)
        const existing = postMap.get(slug);
        if (!existing || folder.name > (getPostFolderName(slug) || "")) {
            postMap.set(slug, post);
        }
    }

    const posts = Array.from(postMap.values());
    const finalSlugs = posts.map(p => p.slug);

    // Fetch tags from PocketBase
    try {
        const tagsMap = await getTagsForPosts(finalSlugs);
        for (const post of posts) {
            if (tagsMap[post.slug] && tagsMap[post.slug].length > 0) {
                // Join tags with comma for display in list view
                post.tag = tagsMap[post.slug].join(", ");
            }
        }
    } catch (e) {
        console.error("Failed to fetch tags for list view:", e);
    }

    // Sort by date descending
    posts.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    return posts;
}

/**
 * Get a single post by slug (title portion of folder name)
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!fs.existsSync(CONTENTS_DIR)) return null;

    const folders = fs.readdirSync(CONTENTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("_"));

    for (const folder of folders) {
        const parsed = parseFolderName(folder.name);
        if (!parsed) continue;

        const folderPath = path.join(CONTENTS_DIR, folder.name);
        const mdPath = path.join(folderPath, `${slug}.md`);
        
        if (fs.existsSync(mdPath)) {
            const rawContent = fs.readFileSync(mdPath, "utf-8");

            // Replace relative image references with API route
            const content = rawContent.replace(
                /!\[([^\]]*)\]\(images\/([^)]+)\)/g,
                `![$1](/api/blog-image/${slug}/$2)`
            );

            const thumbnail = findThumbnail(folderPath, slug);
            const excerpt = extractExcerpt(rawContent);

            // Fetch tags from PocketBase
            let tag = parsed.tag;
            try {
                const tagsMap = await getTagsForPosts([slug]);
                if (tagsMap[slug] && tagsMap[slug].length > 0) {
                    tag = tagsMap[slug].join(", ");
                }
            } catch (e) {
                console.error("Failed to fetch tags for post view:", e);
            }

            return {
                slug,
                title: readStoredTitle(folderPath) ?? parsed.title.replace(/-/g, " "),
                date: formatDate(parsed.rawDate),
                rawDate: parsed.rawDate,
                tag,
                userId: parsed.userId,
                excerpt,
                thumbnail,
                content,
            };
        }
    }

    return null;
}

/**
 * Get latest N posts
 */
export async function getLatestPosts(count: number): Promise<BlogPost[]> {
    const all = await getAllPosts();
    return all.slice(0, count);
}

/**
 * Find the folder name for a given slug
 */
export function getPostFolderName(slug: string): string | null {
    if (!fs.existsSync(CONTENTS_DIR)) return null;

    const folders = fs.readdirSync(CONTENTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("_"));

    for (const folder of folders) {
        const parsed = parseFolderName(folder.name);
        if (!parsed) continue;
        const mdPath = path.join(CONTENTS_DIR, folder.name, `${slug}.md`);
        if (fs.existsSync(mdPath)) {
            return folder.name;
        }
    }
    return null;
}

/**
 * Get list of images in a post's images/ directory
 */
export function getPostImages(slug: string): string[] {
    const folderName = getPostFolderName(slug);
    if (!folderName) return [];

    const imagesDir = path.join(CONTENTS_DIR, folderName, "images");
    if (!fs.existsSync(imagesDir)) return [];

    return fs.readdirSync(imagesDir)
        .filter((f) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));
}

/**
 * Get raw content of a post (without image URL replacement)
 */
export function getPostRawContent(slug: string): string | null {
    const folderName = getPostFolderName(slug);
    if (!folderName) return null;

    const folderPath = path.join(CONTENTS_DIR, folderName);
    const files = fs.readdirSync(folderPath);
    const mdFile = files.find((f) => f.endsWith(".md"));
    if (!mdFile) return null;

    return fs.readFileSync(path.join(folderPath, mdFile), "utf-8");
}

export { CONTENTS_DIR };
