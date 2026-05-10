import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postUuid: string }> }
) {
    const { postUuid } = await params;

    try {
        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
        const pb = new PocketBase(pbUrl);

        const records = await pb.collection("comments").getFullList({
            filter: `post_uuid='${postUuid}'`,
            sort: 'created',
            expand: 'user_id'
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        // Return empty array if collection doesn't exist yet
        return NextResponse.json([]);
    }
}
