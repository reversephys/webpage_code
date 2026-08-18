import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/staff";
import { getUserMap } from "@/lib/users";
import { getServerUserFromCookie } from "@/lib/auth-server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const posts = await getAllPosts();
    const userMap = await getUserMap();

    const user = await getServerUserFromCookie();
    const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
    
    if (permGroup < 3) {
        return NextResponse.json({ error: "Forbidden: permission >= 3 required" }, { status: 403 });
    }
    
    const hasAccess = true;

    const filteredPosts = hasAccess
        ? posts
        : posts.filter(p => p.tag.split(",").map(t => t.trim()).includes("public"));

    const postsWithAuthor = filteredPosts.map(post => {
        const authorName = post.userId ? (userMap.get(post.userId) || "Unknown") : "Unknown";
        return { ...post, authorName };
    });

    return NextResponse.json(postsWithAuthor);
}
