import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

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

        const formData = await request.formData();
        const avatarFile = formData.get("avatar");

        if (!avatarFile) {
            return NextResponse.json({ error: "No avatar provided." }, { status: 400 });
        }

        const updateData = new FormData();
        updateData.append("avatar", avatarFile);

        await pb.collection("users").update(userId, updateData);

        const refreshed = await pb.collection("users").authRefresh();

        return NextResponse.json({
            success: true,
            token: refreshed.token,
            record: refreshed.record,
        });
    } catch (error) {
        console.error("Profile avatar update error:", error);
        return NextResponse.json({ error: "Failed to update avatar." }, { status: 500 });
    }
}
