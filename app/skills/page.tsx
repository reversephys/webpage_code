"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

interface Skill {
    title: string;
    content: string;
    authorName?: string;
    slug: string;
}

export default function SkillsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
            } else if ((user.permission_group || 0) < 3) {
                router.push("/");
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await fetch("/api/skills/list");
                const data = await res.json();
                setSkills(data);
            } catch {
                console.error("Failed to load skills.");
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-4xl mx-auto text-center text-gray-400">Loading...</div>
            </main>
        );
    }

    if (!user) return null;

    const filtered = query.trim()
        ? skills.filter((skill) => {
            const q = query.toLowerCase();
            return (
                skill.title.toLowerCase().includes(q) ||
                skill.content.toLowerCase().includes(q)
            );
        })
        : skills;

    return (
        <main className="min-h-screen bg-background pt-32 pb-10 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-end justify-between mb-2">
                    <h1 className="text-3xl md:text-5xl font-eczar tracking-tight">Skills.md / Prompt </h1>
                    <Link
                        href="/skills/write"
                        className="text-sm font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
                    >
                        Write
                    </Link>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-8 tracking-wide">
                    LLM 활용에 최적화된 프롬프트와 유용한 스킬들을 쉽게 공유하기 위한 페이지입니다.
                </p>

                {/* Search bar */}
                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search skills.md..."
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                </div>

                {loading ? (
                    <p className="text-gray-500 text-center py-20 text-lg">Loading skills...</p>
                ) : (
                    <div className="grid gap-3">
                        {filtered.map((skill) => (
                            <Link
                                key={skill.slug}
                                href={`/skills/${skill.slug}`}
                                className="block border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors group bg-white dark:bg-black/20"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold font-serif group-hover:underline decoration-1 underline-offset-4">{skill.title}</h2>
                                        <div className="text-xs tracking-[0.2em] text-gray-400 uppercase font-sans mt-2">
                                            BY {skill.authorName}
                                        </div>
                                    </div>
                                    <span className="text-xs font-sans uppercase tracking-widest text-gray-400 group-hover:text-foreground transition-colors">
                                        View
                                    </span>
                                </div>
                            </Link>
                        ))}

                        {filtered.length === 0 && !loading && (
                            <p className="text-gray-500 text-center py-20 text-lg">
                                {query.trim() ? "No skills.md match your search." : "No skills yet."}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
