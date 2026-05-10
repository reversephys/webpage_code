import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

/**
 * POST /api/profile/password
 * Update the authenticated user's password.
 * Requires: oldPassword, newPassword, passwordConfirm
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!token) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
        const { oldPassword, newPassword, passwordConfirm } = await request.json();

        if (!oldPassword || !newPassword || !passwordConfirm) {
            return NextResponse.json(
                { error: "All password fields are required." },
                { status: 400 }
            );
        }

        if (newPassword !== passwordConfirm) {
            return NextResponse.json(
                { error: "New password and confirm password do not match." },
                { status: 400 }
            );
        }

        const pb = new PocketBase("http://127.0.0.1:8090");
        pb.authStore.save(token, null);

        // Validate token and get user ID
        const authData = await pb.collection("users").authRefresh();
        const userId = authData.record.id;

        // Update the user's password
        await pb.collection("users").update(userId, {
            oldPassword: oldPassword,
            password: newPassword,
            passwordConfirm: passwordConfirm,
        });

        // After updating the password, the current token might be invalidated by PocketBase,
        // so we need to re-authenticate or refresh with the new password? 
        // Actually, updating a password in PocketBase invalidates all old tokens *except* it returns a new token 
        // if auth record update succeeds (not always, let's just authenticate again to get a fresh token).
        const freshAuth = await pb.collection("users").authWithPassword(
            authData.record.email || authData.record.username,
            newPassword
        );

        return NextResponse.json({
            success: true,
            token: freshAuth.token,
            record: freshAuth.record,
        });

    } catch (error: any) {
        console.error("Password update error:", error);

        // Try to extract a meaningful error message from PocketBase Exception
        let errorMessage = "Failed to update password.";
        if (error.response?.data?.oldPassword?.message) {
            errorMessage = `Old Password: ${error.response.data.oldPassword.message}`;
        } else if (error.response?.data?.password?.message) {
            errorMessage = `New Password: ${error.response.data.password.message}`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}
