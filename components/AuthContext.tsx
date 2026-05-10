"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { pb } from "@/lib/pocketbase";
import { loginUser, registerUser, logoutUser, getCurrentUser, UserRecord } from "@/lib/auth";

interface AuthContextType {
    user: UserRecord | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, passwordConfirm: string, name: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from cookie (pb_auth) if pb.authStore is empty
        if (!pb.authStore.isValid && typeof document !== "undefined") {
            const cookieToken = document.cookie
                .split("; ")
                .find(row => row.startsWith("pb_auth="))
                ?.split("=")[1];

            if (cookieToken) {
                pb.authStore.save(cookieToken, null);
            }
        }

        const currentUser = getCurrentUser();
        setUser(currentUser);
        setLoading(false);

        // Listen for auth changes
        const unsubscribe = pb.authStore.onChange(() => {
            setUser(getCurrentUser());
        });

        return () => {
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

    const logout = () => {
        logoutUser();
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
