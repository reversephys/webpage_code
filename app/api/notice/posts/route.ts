import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/notice";
import { getServerUserFromCookie } from "@/lib/auth-server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const posts = await getAllPosts();
    
    const user = await getServerUserFromCookie();
    const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
    const hasAccess = permGroup >= 3;

    const filteredPosts = hasAccess
        ? posts
        : posts.filter(p => p.tag.split(",").map(t => t.trim()).includes("public"));

    return NextResponse.json(filteredPosts);
}
