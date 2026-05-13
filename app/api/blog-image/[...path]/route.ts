import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONTENTS_DIR = path.join(process.cwd(), "..", "Contents", "BLOG");

const MIME_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: segments } = await params;

    if (!segments || segments.length < 2) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // segments: [slug, filename]
    const slug = segments[0];
    const filename = segments.slice(1).join("/");

    // Find the folder matching this slug (slug is now the md file name)
    const folders = fs.readdirSync(CONTENTS_DIR, { withFileTypes: true });
    const matchingFolder = folders.find((f) => {
        if (!f.isDirectory()) return false;
        if (f.name.startsWith("_")) return false;
        const mdPath = path.join(CONTENTS_DIR, f.name, `${slug}.md`);
        return fs.existsSync(mdPath);
    })?.name;

    if (!matchingFolder) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const filePath = path.join(CONTENTS_DIR, matchingFolder, "images", filename);

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
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
