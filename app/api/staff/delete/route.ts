import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CONTENTS_DIR, getPostFolderName } from "@/lib/staff";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { slug } = body;

        if (!slug) {
            return NextResponse.json({ error: "Missing slug" }, { status: 400 });
        }

        const folderName = getPostFolderName(slug);
        if (!folderName) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const folderPath = path.join(CONTENTS_DIR, folderName);

        // Recursive delete
        fs.rmSync(folderPath, { recursive: true, force: true });

        return NextResponse.json({ success: true, redirect: "/staff" });
    } catch (error) {
        console.error("Delete error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
