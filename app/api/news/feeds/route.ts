import { NextRequest, NextResponse } from "next/server";
import { getFeeds, addFeed, removeFeed } from "@/lib/news";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth-server";

export async function GET() {
    const feeds = getFeeds();
    return NextResponse.json(feeds);
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    if ((user.permission_group || 0) < 3) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { url } = await request.json();
        if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

        const success = addFeed(url);
        if (!success) return NextResponse.json({ error: "Feed already exists" }, { status: 409 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    if ((user.permission_group || 0) < 3) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { url } = await request.json();
        if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

        const success = removeFeed(url);
        if (!success) return NextResponse.json({ error: "Feed not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
