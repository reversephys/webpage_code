import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/token
 * Returns the current user's auth token from the httpOnly cookie.
 * Used by client components that need to send the token in API requests.
 */
export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("pb_auth")?.value;

    if (!token) {
        return NextResponse.json({ token: null }, { status: 401 });
    }

    return NextResponse.json({ token });
}
