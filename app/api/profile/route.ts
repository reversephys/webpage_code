import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

/**
 * GET /api/profile
 * Fetch the latest user data (including custom fields like introduction)
 * by validating the auth token server-side via PocketBase authRefresh.
 */
export async function GET(request: NextRequest) {
    const record = await verifyAuth(request);
    if (!record) {
        return unauthorizedResponse();
    }

    return NextResponse.json({
        id: record.id,
        collectionId: record.collectionId,
        username: record.username,
        email: record.email || "",
        name: record.name || "",
        avatar: record.avatar || "",
        introduction: record.introduction || "",
        created: record.created,
        updated: record.updated,
    });
}
