import { NextResponse } from "next/server";
import { getAllSkills } from "@/lib/skills";
import { getUserMap } from "@/lib/users";

export const dynamic = 'force-dynamic';

export async function GET() {
    const skills = getAllSkills();
    const userMap = await getUserMap();

    const skillsWithAuthor = skills.map(skill => {
        const authorName = skill.userId ? (userMap.get(skill.userId) || "Unknown") : "Unknown";
        return { ...skill, authorName };
    });

    return NextResponse.json(skillsWithAuthor);
}
