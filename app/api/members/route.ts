import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function GET() {
    try {
        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
        const pb = new PocketBase(pbUrl);

        // Fetch users where permission_group is 1, 2, 3, or 4
        // Sort by permission_group ascending, then created descending
        const records = await pb.collection("users").getFullList({
            filter: "permission_group >= 1 && permission_group <= 4",
            sort: "permission_group,-created",
        });

        const members = records.map(r => ({
            id: r.id,
            name: r.username,
            avatar: r.avatar ? `/api/files/_pb_users_auth_/${r.id}/${r.avatar}` : null,
            introduction: r.introduction || "",
            permission_group: r.permission_group
        }));

        return NextResponse.json({ success: true, members });
    } catch (error: any) {
        console.error("Failed to fetch members:", error);
        return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
    }
}
