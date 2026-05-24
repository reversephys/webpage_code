import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SKILLS_DIR, getSkillFolderName } from "@/lib/skills";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

function containsDangerousContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("<script")) return true;
    if (lowerContent.includes("onerror")) return true;
    return false;
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();
    if ((user.permission_group || 0) < 3) {
        return NextResponse.json({ error: "Forbidden: permission >= 3 required" }, { status: 403 });
    }

    try {
        const { slug, newTitle, content } = await request.json();

        if (!slug || !newTitle || !content) {
            return NextResponse.json({ error: "Missing fields." }, { status: 400 });
        }

        // Security check
        if (containsDangerousContent(content) || containsDangerousContent(newTitle)) {
            return NextResponse.json({ redirect: "/skills" }, { status: 200 });
        }

        const oldFolderName = getSkillFolderName(slug);
        if (!oldFolderName) {
            return NextResponse.json({ error: "Original skill not found." }, { status: 404 });
        }

        const oldFolderPath = path.join(SKILLS_DIR, oldFolderName);
        const mdPath = path.join(oldFolderPath, `${slug}.md`);

        // If title changed, rename the folder
        const match = oldFolderName.match(/^(\d{14})_([^_]+)_(.+)$/i);
        if (match) {
            const timestamp = match[1];
            const userId = match[2];
            const safeNewTitle = newTitle.replace(/[^a-zA-Z0-9\-\.\_\s]/g, "").trim();
            const newFolderName = `${timestamp}_${userId}_${safeNewTitle}`;
            const newFolderPath = path.join(SKILLS_DIR, newFolderName);

            if (oldFolderName !== newFolderName) {
                if (fs.existsSync(newFolderPath)) {
                    return NextResponse.json({ error: "New title already exists." }, { status: 409 });
                }
                fs.renameSync(oldFolderPath, newFolderPath);
                // write to new path
                fs.writeFileSync(path.join(newFolderPath, `${slug}.md`), content, "utf-8");
            } else {
                fs.writeFileSync(mdPath, content, "utf-8");
            }
        } else {
            fs.writeFileSync(mdPath, content, "utf-8");
        }

        return NextResponse.json({ redirect: `/skills/${slug}`, success: true });
    } catch (error) {
        console.error("Edit error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
