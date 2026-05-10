import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, getPostImages } from "@/lib/notice";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const slug = (await params).slug;
    const post = await getPostBySlug(slug);

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Also return list of existing images for logic in editor
    const images = getPostImages(slug).map(img => ({
        name: img,
        url: `/api/notice-image/${slug}/${img}`
    }));

    return NextResponse.json({ ...post, images });
}
