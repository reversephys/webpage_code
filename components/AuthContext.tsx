"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { pb } from "@/lib/pocketbase";
import { loginUser, registerUser, logoutUser, getCurrentUser, UserRecord } from "@/lib/auth";

interface AuthContextType {
    user: UserRecord | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, passwordConfirm: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            // Restore session via server route since pb_auth is httpOnly.
            if (!pb.authStore.isValid) {
                try {
                    const res = await fetch("/api/auth/token");
                    if (res.ok) {
                        const { token } = await res.json();
                        if (token && !cancelled) {
                            pb.authStore.save(token, null);
                        }
                    }
                } catch {
                    // Ignore — user simply isn't logged in.
                }
            }

            if (!cancelled) {
                setUser(getCurrentUser());
                setLoading(false);
            }
        })();

        const unsubscribe = pb.authStore.onChange(() => {
            setUser(getCurrentUser());
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const login = async (username: string, password: string) => {
        await loginUser(username, password);
        setUser(getCurrentUser());
    };

    const register = async (username: string, password: string, passwordConfirm: string, name: string) => {
        await registerUser(username, password, passwordConfirm, name);
        setUser(getCurrentUser());
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
