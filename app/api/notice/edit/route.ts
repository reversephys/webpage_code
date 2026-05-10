import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PocketBase from "pocketbase";
import { CONTENTS_DIR, getPostFolderName } from "@/lib/notice";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const formData = await request.formData();
        const slug = formData.get("slug") as string; // This is the UUID
        const title = formData.get("title") as string;
        const tag = formData.get("tag") as string;
        const content = formData.get("content") as string;
        const deletedImagesStr = formData.get("deletedImages") as string;
        const newImages = formData.getAll("newImages") as File[];

        if (!slug || !title || !tag || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find existing folder
        const oldFolderName = getPostFolderName(slug);
        if (!oldFolderName) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const oldFolderPath = path.join(CONTENTS_DIR, oldFolderName);

        // Keep timestamp from old folder
        const match = oldFolderName.match(/^(\d{14})_([^_]+)_(.+)$/);
        if (!match) {
            return NextResponse.json({ error: "Invalid folder structure" }, { status: 500 });
        }
        const timestamp = match[1];

        const safeTitle = title.replace(/[^a-zA-Z0-9가-힣\s-]/g, "").trim().replace(/\s+/g, "-");
        const safeTag = tag.replace(/[^a-zA-Z0-9가-힣\s-]/g, "").trim().replace(/\s+/g, "-");
        const newFolderName = `${timestamp}_${safeTag}_${safeTitle}`;
        const newFolderPath = path.join(CONTENTS_DIR, newFolderName);

        // Rename folder if title/tag changed
        if (oldFolderName !== newFolderName) {
            fs.renameSync(oldFolderPath, newFolderPath);
        }

        // Update MD file - MUST KEEP SAME FILENAME (slug)
        const mdPath = path.join(newFolderPath, `${slug}.md`);
        fs.writeFileSync(mdPath, content, "utf-8");

        // Handle images
        const imagesDir = path.join(newFolderPath, "images");
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        // Delete removed images
        if (deletedImagesStr) {
            const deletedImages = JSON.parse(deletedImagesStr) as string[];
            for (const imgName of deletedImages) {
                const imgPath = path.join(imagesDir, imgName);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
        }

        // Add new images
        for (const img of newImages) {
            const buffer = Buffer.from(await img.arrayBuffer());
            fs.writeFileSync(path.join(imagesDir, img.name), buffer);
        }

        // Sync tags to PocketBase
        try {
            const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
            const pb = new PocketBase(pbUrl);

            const token = request.headers.get("Authorization")?.split(" ")[1] || "";
            if (token) {
                pb.authStore.save(token, null);
            }

            const tags = tag.split(",").map(t => t.trim()).filter(Boolean);

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
        }

        return NextResponse.json({ success: true, redirect: `/notice/${slug}` });

    } catch (error) {
        console.error("Edit error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

