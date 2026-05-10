import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, getPostImages, getPostRawContent } from "@/lib/blog";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const post = await getPostBySlug(slug);
    if (!post) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Get raw content (without API URL replacements) for editing
    const rawContent = getPostRawContent(slug) || "";
    const images = getPostImages(slug);

    return NextResponse.json({
        slug: post.slug,
        title: post.title,
        tag: post.tag,
        content: rawContent,
        images: images.map((img) => ({
            name: img,
            url: `/api/blog-image/${slug}/${img}`,
        })),
    });
}
