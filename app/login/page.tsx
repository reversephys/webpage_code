"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
    const { login, register } = useAuth();
    const router = useRouter();

    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState("");
    const [name, setName] = useState(""); // Added name state
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (isRegister) {
                if (password !== passwordConfirm) {
                    setError("Passwords do not match.");
                    setSubmitting(false);
                    return;
                }
                await register(username, password, passwordConfirm, name); // Pass name
            } else {
                await login(username, password);
            }
            router.push("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif flex items-start justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-4xl md:text-6xl font-eczar mb-12 tracking-tight text-center">
                    {isRegister ? "Register" : "Login"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isRegister && (
                        <div>
                            <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">
                                Real Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                                placeholder="Enter your real name"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                            placeholder="Enter your password"
                        />
                    </div>

                    {isRegister && (
                        <div>
                            <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                                placeholder="Confirm your password"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50 rounded"
                    >
                        {submitting ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError("");
                        }}
                        className="text-sm text-gray-500 hover:text-foreground transition-colors underline underline-offset-4"
                    >
                        {isRegister
                            ? "Already have an account? Sign in"
                            : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </main>
    );
}
