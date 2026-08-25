import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

function createUserClient(request: NextRequest) {
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    const pb = new PocketBase(pbUrl);
    const token = request.headers.get("Authorization")?.split(" ")[1] || "";
    pb.authStore.save(token, null);
    return pb;
}

async function findComment(pb: PocketBase, commentId: string) {
    try {
        return await pb.collection("comments").getOne(commentId);
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const { post_uuid, content } = await request.json();

        if (!post_uuid || !content || content.trim() === "") {
            return NextResponse.json({ error: "Post UUID and content are required." }, { status: 400 });
        }

        const pb = createUserClient(request);

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

export async function PATCH(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const { comment_id, content } = await request.json();

        if (!comment_id || !content || content.trim() === "") {
            return NextResponse.json({ error: "Comment ID and content are required." }, { status: 400 });
        }

        const pb = createUserClient(request);
        const comment = await findComment(pb, comment_id);
        if (!comment) {
            return NextResponse.json({ error: "Comment not found." }, { status: 404 });
        }

        // Only the author may rewrite their own comment — admins included.
        if (comment.user_id !== user.id) {
            return NextResponse.json({ error: "Forbidden: You are not the author of this comment." }, { status: 403 });
        }

        const updated = await pb.collection("comments").update(comment_id, { content: content.trim() });

        return NextResponse.json({ success: true, comment: updated });
    } catch (error) {
        console.error("Failed to update comment:", error);
        return NextResponse.json({ error: "Failed to update comment." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    try {
        const { comment_id } = await request.json();

        if (!comment_id) {
            return NextResponse.json({ error: "Comment ID is required." }, { status: 400 });
        }

        const pb = createUserClient(request);
        const comment = await findComment(pb, comment_id);
        if (!comment) {
            return NextResponse.json({ error: "Comment not found." }, { status: 404 });
        }

        // Author, or an admin — same rule the post delete routes use.
        const permGroup = user.permission_group !== undefined ? Number(user.permission_group) : -1;
        if (comment.user_id !== user.id && permGroup !== 99) {
            return NextResponse.json({ error: "Forbidden: You are not the author of this comment." }, { status: 403 });
        }

        await pb.collection("comments").delete(comment_id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return NextResponse.json({ error: "Failed to delete comment." }, { status: 500 });
    }
}
