import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import PocketBase from "pocketbase";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";
import { getValidatedExt, isAllowedImageBuffer } from "@/lib/image-validation";

const CONTENTS_DIR = path.join(process.cwd(), "..", "Contents", "BLOG");

/**
 * Check for dangerous patterns: <script, onerror
 */
function containsDangerousContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("<script")) return true;
    if (lowerContent.includes("onerror")) return true;
    return false;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * Format current date as YYYYMMDDhhmmss
 */
function getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds())
    );
}

/**
 * Sanitize folder name: replace spaces/special chars with hyphens
 */
function sanitizeFolderName(name: string): string {
    return name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9가-힣\-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();
    try {
        const formData = await request.formData();

        const title = formData.get("title") as string;
        const tag = formData.get("tag") as string;
        const content = formData.get("content") as string;
        const imageFiles = formData.getAll("images") as File[];

        // Validate required fields
        if (!title || !tag || !content) {
            return NextResponse.json(
                { error: "Title, tag, and content are required." },
                { status: 400 }
            );
        }

        // Security check: reject <script> and onerror
        if (containsDangerousContent(content) || containsDangerousContent(title)) {
            return NextResponse.json(
                { redirect: "/blog" },
                { status: 200 }
            );
        }

        // Generate folder name
        const timestamp = getTimestamp();
        const sanitizedTag = sanitizeFolderName(tag);
        const sanitizedTitle = sanitizeFolderName(title);
        const userId = sanitizeFolderName(user.id);
        const folderName = `${timestamp}_${userId}_${sanitizedTag}_${sanitizedTitle}`;
        const folderPath = path.join(CONTENTS_DIR, folderName);

        // Validate every image before touching the filesystem so rejected
        // uploads don't leave empty folders behind.
        const imageRenameMap: Record<string, string> = {};
        const preparedImages: Array<{ buffer: Buffer; newFilename: string }> = [];

        for (const file of imageFiles) {
            const ext = getValidatedExt(file.name);
            if (!ext) {
                return NextResponse.json(
                    { error: `Unsupported image type: ${file.name}` },
                    { status: 400 }
                );
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            if (!(await isAllowedImageBuffer(buffer))) {
                return NextResponse.json(
                    { error: `Invalid image content: ${file.name}` },
                    { status: 400 }
                );
            }

            const newFilename = `${generateUUID()}${ext}`;
            imageRenameMap[file.name] = newFilename;
            preparedImages.push({ buffer, newFilename });
        }

        // Create directories now that all images are known to be valid.
        fs.mkdirSync(folderPath, { recursive: true });
        fs.mkdirSync(path.join(folderPath, "images"), { recursive: true });

        for (const { buffer, newFilename } of preparedImages) {
            fs.writeFileSync(path.join(folderPath, "images", newFilename), buffer);
        }

        // Replace image references in markdown content
        let processedContent = content;
        for (const [originalName, uuidName] of Object.entries(imageRenameMap)) {
            // Escape special regex characters in original filename
            const escaped = originalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "g");
            processedContent = processedContent.replace(regex, uuidName);
        }

        // Save markdown file with UUID name
        const mdUUID = generateUUID();
        const mdFilename = `${mdUUID}.md`;
        fs.writeFileSync(
            path.join(folderPath, mdFilename),
            processedContent,
            "utf-8"
        );

        // Sync tags to PocketBase
        try {
            const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
            const pb = new PocketBase(pbUrl);
            
            const token = request.headers.get("Authorization")?.split(" ")[1] || "";
            if (token) {
                pb.authStore.save(token, null);
            }
            
            const tags = tag.split(",").map(t => t.trim()).filter(Boolean);

            await pb.collection("post_tags").create({
                post_uuid: mdUUID,
                tags: tags
            });
        } catch (e) {
            console.error("Failed to sync tags to DB:", e);
        }

        return NextResponse.json(
            { redirect: "/blog", success: true },
            { status: 200 }
        );
    } catch (error) {
        console.error("Publish error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
