"use client";

import { AuthProvider } from "@/components/AuthContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
