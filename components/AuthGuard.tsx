"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function AuthGuard({ children, minPermission }: { children: React.ReactNode, minPermission?: number }) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (minPermission && (user.permission_group || 0) < minPermission) {
                router.push("/");
            }
        }
    }, [user, loading, router, minPermission]);

    if (loading) {
        return (
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-4xl mx-auto text-center text-gray-400">Loading...</div>
            </main>
        );
    }

    if (!user) return null;
    if (minPermission && (user.permission_group || 0) < minPermission) return null;

    return <>{children}</>;
}
