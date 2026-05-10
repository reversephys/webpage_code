import { NextRequest, NextResponse } from "next/server";
import { trackClick } from "@/lib/news-tracking";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { link, title, snippet } = body;

        if (!link || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        trackClick({ link, title, snippet: snippet || "" });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Click tracking error", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
