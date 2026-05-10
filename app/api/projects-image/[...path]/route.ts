import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONTENTS_DIR = path.join(process.cwd(), "..", "Contents", "PROJECTS");

const MIME_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: segments } = await params;

    if (!segments || segments.length === 0) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // segments: [filename]
    const filename = segments.join("/");

    const filePath = path.join(CONTENTS_DIR, "images", filename);

    // Security: ensure we're not escaping the contents directory
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(CONTENTS_DIR))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
}
