import { NextRequest, NextResponse } from "next/server";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ params: string[] }> }
) {
    const { params: segments } = await params;
    // segments: [userId, filename]
    const [userId, filename] = segments;

    if (!userId || !filename) {
        return new NextResponse("Not found", { status: 404 });
    }

    // PocketBase users collection file URL format:
    // /api/files/<collectionNameOrId>/<recordId>/<filename>
    const pbUrl = `${PB_URL}/api/files/users/${userId}/${filename}`;

    try {
        const res = await fetch(pbUrl);
        if (!res.ok) {
            return new NextResponse("Not found", { status: 404 });
        }

        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get("Content-Type") || "image/jpeg";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch {
        return new NextResponse("Error fetching avatar", { status: 500 });
    }
}
