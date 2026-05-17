import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears the httpOnly pb_auth cookie. The client clears its in-memory
 * authStore separately.
 */
export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.set("pb_auth", "", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
    });
    return response;
}
