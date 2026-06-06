import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { pb } from "@/lib/pocketbase";
import { CONTENTS_DIR, getPostFolderName, getPostBySlug } from "@/lib/staff";
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

        const post = await getPostBySlug(slug);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const permGroup = user.permission_group !== undefined ? Number(user.permission_group) : -1;
        if (post.userId !== user.id && permGroup !== 99) {
            return NextResponse.json({ error: "Forbidden: You are not the author of this post" }, { status: 403 });
        }

        const folderName = getPostFolderName(slug);
        if (!folderName) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const folderPath = path.join(CONTENTS_DIR, folderName);

        // Recursive delete
        fs.rmSync(folderPath, { recursive: true, force: true });

        // Delete associated comments and tags
        try {
            const tags = await pb.collection("post_tags").getFullList({ filter: `post_uuid='${slug}'` });
            for (const tag of tags) {
                await pb.collection("post_tags").delete(tag.id);
            }

            const comments = await pb.collection("comments").getFullList({ filter: `post_uuid='${slug}'` });
            for (const comment of comments) {
                await pb.collection("comments").delete(comment.id);
            }
        } catch (e) {
            console.error("Failed to delete related comments/tags:", e);
        }

        return NextResponse.json({ success: true, redirect: "/staff" });
    } catch (error) {
        console.error("Delete error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
