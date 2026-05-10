import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import PocketBase from "pocketbase";
import { getPostFolderName, CONTENTS_DIR } from "@/lib/blog";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

function containsDangerousContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("<script")) return true;
    if (lowerContent.includes("onerror")) return true;
    return false;
}

function generateUUID(): string {
    return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const formData = await request.formData();

        const slug = formData.get("slug") as string;
        const title = formData.get("title") as string;
        const tag = formData.get("tag") as string;
        const content = formData.get("content") as string;
        const newImageFiles = formData.getAll("newImages") as File[];
        const deletedImagesRaw = formData.get("deletedImages") as string;
        const deletedImages: string[] = deletedImagesRaw ? JSON.parse(deletedImagesRaw) : [];

        if (!slug || !title || !tag || !content) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        // Security check
        if (containsDangerousContent(content) || containsDangerousContent(title)) {
            return NextResponse.json({ redirect: "/blog" }, { status: 200 });
        }

        const folderName = getPostFolderName(slug);
        if (!folderName) {
            return NextResponse.json({ error: "Post not found." }, { status: 404 });
        }

        const folderPath = path.join(CONTENTS_DIR, folderName);
        const imagesDir = path.join(folderPath, "images");

        // Ensure images/ exists
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Delete removed images
        for (const imgName of deletedImages) {
            const imgPath = path.join(imagesDir, imgName);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        }

        // Process new images: save with UUID names and build rename mapping
        const imageRenameMap: Record<string, string> = {};

        for (const file of newImageFiles) {
            const ext = path.extname(file.name).toLowerCase() || ".png";
            const uuid = generateUUID();
            const newFilename = `${uuid}${ext}`;

            imageRenameMap[file.name] = newFilename;

            const buffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(path.join(imagesDir, newFilename), buffer);
        }

        // Replace new image references in content
        let processedContent = content;
        for (const [originalName, uuidName] of Object.entries(imageRenameMap)) {
            const escaped = originalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "g");
            processedContent = processedContent.replace(regex, uuidName);
        }

        // Save markdown file
        const files = fs.readdirSync(folderPath);
        const mdFile = files.find((f) => f.endsWith(".md"));

        if (mdFile) {
            fs.writeFileSync(path.join(folderPath, mdFile), processedContent, "utf-8");
        } else {
            const uuid = generateUUID();
            fs.writeFileSync(path.join(folderPath, `${uuid}.md`), processedContent, "utf-8");
        }

        // Sync tags to PocketBase
        try {
            const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
            const pb = new PocketBase(pbUrl);
            
            // Pass the auth token to PocketBase
            const token = request.headers.get("Authorization")?.split(" ")[1] || "";
            if (token) {
                pb.authStore.save(token, null);
            }
            
            // Extract multiple tags
            const tags = tag.split(",").map(t => t.trim()).filter(Boolean);

            // Find existing tag record for this post
            const existingRecords = await pb.collection("post_tags").getList(1, 1, {
                filter: `post_uuid = "${slug}"`
            });

            if (existingRecords.items.length > 0) {
                await pb.collection("post_tags").update(existingRecords.items[0].id, {
                    tags: tags
                });
            } else {
                await pb.collection("post_tags").create({
                    post_uuid: slug,
                    tags: tags
                });
            }
        } catch (e) {
            console.error("Failed to sync tags to DB:", e);
            // Non-blocking error for now
        }

        return NextResponse.json({ redirect: `/blog/${slug}`, success: true });
    } catch (error) {
        console.error("Edit error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
