import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

/**
 * POST /api/auth/register
 * Server-side registration: creates a new user in PocketBase,
 * auto-logs in, and returns the token + record.
 */
export async function POST(request: NextRequest) {
    try {
        const { username, password, passwordConfirm, name } = await request.json();
        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

        if (!username || !password || !passwordConfirm) {
            return NextResponse.json(
                { error: "Username and password fields are required." },
                { status: 400 }
            );
        }

        const { getInitialPermissionGroup } = await import("@/lib/promotion");
        const permissionGroup = getInitialPermissionGroup();
        const pb = new PocketBase(pbUrl);

        // Create the user
        await pb.collection("users").create({
            username,
            password,
            passwordConfirm,
            name: name || "",
            permission_group: permissionGroup,
        });

        // Auto-login after registration
        const authData = await pb.collection("users").authWithPassword(username, password);

        return NextResponse.json({
            token: authData.token,
            record: authData.record,
        });
    } catch (error: any) {
        console.error("Register error details:", error.data || error);
        
        let message = "Registration failed.";
        if (error.data?.data) {
            // PocketBase validation error details
            const firstError = Object.values(error.data.data)[0] as any;
            message = firstError?.message || "Invalid data provided.";
        } else if (error.message) {
            message = error.message;
        }
        
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
