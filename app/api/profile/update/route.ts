import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

/**
 * POST /api/profile/update
 * Update the authenticated user's profile fields (introduction, etc.).
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!token) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
        const pb = new PocketBase("http://127.0.0.1:8090");
        pb.authStore.save(token, null);

        // Validate token and get user ID
        const authData = await pb.collection("users").authRefresh();
        const userId = authData.record.id;

        const body = await request.json();
        const { introduction, name } = body;

        // Build update payload with only provided fields
        const updateData: Record<string, string> = {};
        if (typeof introduction === "string") {
            updateData.introduction = introduction;
        }
        if (typeof name === "string") {
            updateData.name = name;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
        }

        // Update the user record
        await pb.collection("users").update(userId, updateData);

        // Return refreshed auth data
        const refreshed = await pb.collection("users").authRefresh();

        return NextResponse.json({
            success: true,
            token: refreshed.token,
            record: refreshed.record,
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }
}
