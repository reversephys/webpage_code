import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SKILLS_DIR, getSkillFolderName } from "@/lib/skills";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    if (!slug) {
        return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const folderName = getSkillFolderName(slug);
    if (!folderName) {
        return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const filename = `${slug}.md`;
    const filePath = path.join(SKILLS_DIR, folderName, filename);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Get actual title for download filename if possible
    let downloadFilename = filename;
    const match = folderName.match(/^(\d{14})_([^_]+)_(.+)$/i);
    if (match) {
        downloadFilename = `${match[3]}.md`;
    }

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
            "Content-Type": "text/markdown",
        },
    });
}
