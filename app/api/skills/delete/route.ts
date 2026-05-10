import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SKILLS_DIR, getSkillFolderName } from "@/lib/skills";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const { slug } = await request.json();

        if (!slug) {
            return NextResponse.json({ error: "Slug is required." }, { status: 400 });
        }

        const folderName = getSkillFolderName(slug);
        if (!folderName) {
            return NextResponse.json({ error: "Skill not found." }, { status: 404 });
        }

        const folderPath = path.join(SKILLS_DIR, folderName);

        if (fs.existsSync(folderPath)) {
            const newPath = path.join(SKILLS_DIR, `_${folderName}`);
            fs.renameSync(folderPath, newPath);
        }

        return NextResponse.json({ redirect: "/skills", success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
