"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { NoticePost } from "@/lib/notice";
import { useAuth } from "@/components/AuthContext";
import { Loader2, Search } from "lucide-react";

export default function NoticePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState<NoticePost[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const [visibleCount, setVisibleCount] = useState(10);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/notice/posts");
                const data = await res.json();
                setPosts(data);
            } catch {
                console.error("Failed to load notice posts.");
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const filtered = query.trim()
        ? posts.filter((post) => {
            const q = query.toLowerCase();
            return (
                post.title.toLowerCase().includes(q) ||
                post.tag.toLowerCase().includes(q) ||
                post.excerpt.toLowerCase().includes(q)
            );
        })
        : posts;

    const pinnedPosts = filtered.filter(p => p.tag.split(",").map(t => t.trim().toLowerCase()).includes("pinned"));
    const normalPosts = filtered.filter(p => !p.tag.split(",").map(t => t.trim().toLowerCase()).includes("pinned"));
    const sortedPosts = [...pinnedPosts, ...normalPosts];

    useEffect(() => {
        setVisibleCount(10);
    }, [query]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [sortedPosts.length, visibleCount]);

    return (
        <main className="min-h-screen bg-background pt-32 pb-10 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-end justify-between mb-2">
                    <h1 className="text-3xl md:text-5xl font-eczar tracking-tight">Notice</h1>
                    {user && (user.permission_group || 0) >= 4 && (
                        <Link
                            href="/notice/write"
                            className="text-sm font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
                        >
                            Write
                        </Link>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-8 tracking-wide">
                    Physical Lab의 공식 행사와 주요 소식을 외부에 알리는 공간입니다.
                </p>

                {/* Search bar */}
                <div className="relative mb-8">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notices by title, tag, or content..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                {loading ? (
                    <p className="text-gray-500 text-center py-20 text-lg">Loading...</p>
                ) : (
                    <div className="space-y-6">
                        {sortedPosts.length === 0 ? (
                            <p className="text-gray-500 text-center py-20 italic">No posts found.</p>
                        ) : (
                            <>
                                {sortedPosts.slice(0, visibleCount).map((post) => (
                                    <div key={post.slug} className={`group border-b border-gray-100 dark:border-gray-800 pb-6 ${post.tag.includes('pinned') ? 'bg-gray-50/50 dark:bg-gray-900/50 -mx-4 px-4 rounded-lg pt-4' : ''}`}>
                                        {/* Content (Full Width) */}
                                        <div>
                                            <div className="flex items-center gap-4 mb-2 text-xs tracking-[0.2em] uppercase font-sans">
                                                {post.tag.includes('pinned') && (
                                                    <span className="text-red-500 font-bold flex items-center gap-1">
                                                        📌 PINNED
                                                    </span>
                                                )}
                                                <span className="text-gray-400">{post.date}</span>
                                                <span className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700" />
                                                <span className="text-gray-400">{post.tag}</span>
                                            </div>

                                            <Link href={`/notice/${post.slug}`}>
                                                <h2 className="text-3xl font-bold mb-2 group-hover:underline decoration-1 underline-offset-4 cursor-pointer">
                                                    {post.title}
                                                </h2>
                                            </Link>

                                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                                                {post.excerpt}
                                            </p>

                                            <Link
                                                href={`/notice/${post.slug}`}
                                                className="inline-flex items-center text-xs font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors mt-4"
                                            >
                                                Read More
                                            </Link>
                                        </div>
                                    </div>
                                ))}

                                {visibleCount < sortedPosts.length && (
                                    <div ref={loaderRef} className="py-10 text-center text-gray-400 flex justify-center items-center gap-2 font-sans text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Loading more posts...</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
