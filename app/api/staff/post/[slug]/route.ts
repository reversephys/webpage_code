import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, getPostImages } from "@/lib/staff";
import { getServerUserFromCookie } from "@/lib/auth-server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const slug = (await params).slug;
    
    const user = await getServerUserFromCookie();
    const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
    if (permGroup < 4) {
        return NextResponse.json({ error: "Forbidden: permission >= 4 required" }, { status: 403 });
    }
    const post = await getPostBySlug(slug);

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Also return list of existing images for logic in editor
    const images = getPostImages(slug).map(img => ({
        name: img,
        url: `/api/staff-image/${slug}/${img}`
    }));

    return NextResponse.json({ ...post, images });
}
