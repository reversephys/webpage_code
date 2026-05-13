import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CONTENTS_DIR, getPostFolderName } from "@/lib/notice";
import mime from "mime";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const pathSegments = (await params).path;
    // URL: /api/notice-image/[slug]/[filename]
    // pathSegments: [slug, filename]

    if (pathSegments.length < 2) {
        return new NextResponse("Invalid path", { status: 400 });
    }

    const slug = pathSegments[0];
    const filename = pathSegments[1];

    const folderName = getPostFolderName(slug);
    if (!folderName) {
        return new NextResponse("Post not found", { status: 404 });
    }

    const filePath = path.join(CONTENTS_DIR, folderName, "images", filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse("Image not found", { status: 404 });
    }

    const ALLOWED_MIME = new Set([
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
    ]);
    const detected = mime.getType(filePath);
    if (!detected || !ALLOWED_MIME.has(detected)) {
        return new NextResponse("Unsupported image type", { status: 415 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": detected,
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
