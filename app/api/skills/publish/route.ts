import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { SKILLS_DIR } from "@/lib/skills";
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
    try {
        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
        }

        // Security check
        if (containsDangerousContent(content) || containsDangerousContent(title)) {
            return NextResponse.json({ redirect: "/skills" }, { status: 200 });
        }

        // Sanitize filename (basic)
        const safeTitle = title.replace(/[^a-zA-Z0-9\-\.\_\s]/g, "").trim();
        const safeUserId = user.id.replace(/_/g, "");
        if (!safeTitle) {
            return NextResponse.json({ error: "Invalid title." }, { status: 400 });
        }

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, "0") +
            now.getDate().toString().padStart(2, "0") +
            now.getHours().toString().padStart(2, "0") +
            now.getMinutes().toString().padStart(2, "0") +
            now.getSeconds().toString().padStart(2, "0");

        const folderName = `${timestamp}_${safeUserId}_${safeTitle}`;
        const folderPath = path.join(SKILLS_DIR, folderName);

        // Check if exists (prevent overwrite on create)
        if (fs.existsSync(folderPath)) {
            return NextResponse.json({ error: "Skill already exists." }, { status: 409 });
        }

        fs.mkdirSync(folderPath, { recursive: true });

        const uuid = crypto.randomUUID();
        const mdPath = path.join(folderPath, `${uuid}.md`);
        fs.writeFileSync(mdPath, content, "utf-8");

        return NextResponse.json({ redirect: "/skills", success: true });
    } catch (error) {
        console.error("Publish error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
