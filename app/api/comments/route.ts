import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const { post_uuid, content } = await request.json();

        if (!post_uuid || !content || content.trim() === "") {
            return NextResponse.json({ error: "Post UUID and content are required." }, { status: 400 });
        }

        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
        const pb = new PocketBase(pbUrl);
        const token = request.headers.get("Authorization")?.split(" ")[1] || "";
        pb.authStore.save(token, null);

        const newComment = await pb.collection("comments").create({
            post_uuid,
            user_id: user.id,
            content: content.trim()
        });

        return NextResponse.json({ success: true, comment: newComment });
    } catch (error) {
        console.error("Failed to post comment:", error);
        return NextResponse.json({ error: "Failed to post comment. Did you run /setup-db?" }, { status: 500 });
    }
}
