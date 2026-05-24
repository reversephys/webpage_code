import { NextResponse } from "next/server";
import { getAllSkills } from "@/lib/skills";
import { getUserMap } from "@/lib/users";
import { getServerUserFromCookie } from "@/lib/auth-server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getServerUserFromCookie();
    const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
    if (permGroup < 3) {
        return NextResponse.json({ error: "Forbidden: permission >= 3 required" }, { status: 403 });
    }

    const skills = getAllSkills();
    const userMap = await getUserMap();

    const skillsWithAuthor = skills.map(skill => {
        const authorName = skill.userId ? (userMap.get(skill.userId) || "Unknown") : "Unknown";
        return { ...skill, authorName };
    });

    return NextResponse.json(skillsWithAuthor);
}
