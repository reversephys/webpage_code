import { NextResponse } from "next/server";
import { getTopIssues } from "@/lib/news-tracking";

export const dynamic = 'force-dynamic';

export async function GET() {
    const topIssues = getTopIssues(2);
    return NextResponse.json(topIssues);
}
