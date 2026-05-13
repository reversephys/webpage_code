import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import PocketBase from "pocketbase";
import { CONTENTS_DIR } from "@/lib/notice";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";
import { getValidatedExt, isAllowedImageBuffer } from "@/lib/image-validation";

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const formData = await request.formData();
        const title = formData.get("title") as string;
        const tag = formData.get("tag") as string;
        const content = formData.get("content") as string;
        const images = formData.getAll("images") as File[];

        if (!title || !tag || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate folder name: YYYYMMDDHHMMSS_Tag_Title
        // Simplify to just YYYYMMDDHHMMSS_Tag_Title to ensure uniqueness and order
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, "0") +
            now.getDate().toString().padStart(2, "0") +
            now.getHours().toString().padStart(2, "0") +
            now.getMinutes().toString().padStart(2, "0") +
            now.getSeconds().toString().padStart(2, "0");

        const safeTitle = title.replace(/[^a-zA-Z0-9가-힣\s-]/g, "").trim().replace(/\s+/g, "-");
        const safeTag = tag.replace(/[^a-zA-Z0-9가-힣\s-]/g, "").trim().replace(/\s+/g, "-");

        const folderName = `${timestamp}_${safeTag}_${safeTitle}`;
        const folderPath = path.join(CONTENTS_DIR, folderName);

        if (fs.existsSync(folderPath)) {
            return NextResponse.json({ error: "Post already exists" }, { status: 409 });
        }

        fs.mkdirSync(folderPath, { recursive: true });

        // Save images
        const imagesDir = path.join(folderPath, "images");
        if (images.length > 0) {
            fs.mkdirSync(imagesDir, { recursive: true });
            for (const img of images) {
                const safeName = path.basename(img.name);
                if (!getValidatedExt(safeName)) {
                    return NextResponse.json(
                        { error: `Unsupported image type: ${img.name}` },
                        { status: 400 }
                    );
                }
                const buffer = Buffer.from(await img.arrayBuffer());
                if (!(await isAllowedImageBuffer(buffer))) {
                    return NextResponse.json(
                        { error: `Invalid image content: ${img.name}` },
                        { status: 400 }
                    );
                }
                fs.writeFileSync(path.join(imagesDir, safeName), buffer);
            }
        }

        // Save markdown file with UUID name
        const mdUUID = crypto.randomUUID();
        const mdPath = path.join(folderPath, `${mdUUID}.md`);
        fs.writeFileSync(mdPath, content, "utf-8");

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

        return NextResponse.json({ success: true, redirect: `/notice/${mdUUID}` });

    } catch (error) {
        console.error("Publish error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
