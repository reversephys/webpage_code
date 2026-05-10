import PocketBase from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Verify auth token from request Authorization header.
 * Returns the PocketBase auth record if valid, null otherwise.
 */
export async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7);
    if (!token) return null;

    try {
        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
        const pb = new PocketBase(pbUrl);
        pb.authStore.save(token, null);
        // Validate the token by refreshing auth
        const authData = await pb.collection("users").authRefresh();
        return authData.record;
    } catch {
        return null;
    }
}

/**
 * Returns a 401 Unauthorized response.
 */
export function unauthorizedResponse() {
    return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
    );
}

/**
 * Get user securely in a Server Component using cookies.
 */
export async function getServerUserFromCookie() {
    const cookieStore = await cookies();
    const token = cookieStore.get("pb_auth")?.value;
    if (!token) return null;

    try {
        const pb = new PocketBase("http://127.0.0.1:8090");
        pb.authStore.save(token, null);
        const authData = await pb.collection("users").authRefresh();
        return authData.record;
    } catch {
        return null;
    }
}
