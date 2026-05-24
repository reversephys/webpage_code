"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";

interface BlogPost {
    slug: string;
    title: string;
    date: string;
    rawDate: string;
    tag: string;
    excerpt: string;
    thumbnail: string | null;
    content?: string;
    authorName?: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [visibleCount, setVisibleCount] = useState(10);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/blog/posts");
                const data = await res.json();
                setPosts(data);
            } catch {
                console.error("Failed to load posts.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = query.trim()
        ? posts.filter((post) => {
            const q = query.toLowerCase();
            return (
                post.title.toLowerCase().includes(q) ||
                post.tag.toLowerCase().includes(q) ||
                post.excerpt.toLowerCase().includes(q) ||
                (post.content && post.content.toLowerCase().includes(q))
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
                    <h1 className="text-3xl md:text-5xl font-eczar tracking-tight">Posts</h1>
                    {user && user.permission_group !== undefined && Number(user.permission_group) >= 3 && (
                        <Link
                            href="/blog/write"
                            className="text-sm font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
                        >
                            Write
                        </Link>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-8 tracking-wide">
                    Physical Lab에서 진행한 연구와 작업 내역을 상세히 기록하고 공유하는 페이지입니다.
                </p>

                {/* Search bar */}
                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                        placeholder="Search by title, tag, or content..."
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                    <button
                        onClick={() => {/* filtering is real-time via state */ }}
                        className="px-5 py-2.5 text-sm font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 hover:bg-foreground hover:text-background transition-colors"
                    >
                        Search
                    </button>
                </div>

                {loading ? (
                    <p className="text-gray-500 text-center py-20 text-lg">Loading posts...</p>
                ) : (
                    <div className="space-y-6">
                        {sortedPosts.slice(0, visibleCount).map((post) => (
                            <div key={post.slug} className={`group grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start border-b border-gray-100 dark:border-gray-800 pb-6 ${post.tag.includes('pinned') ? 'bg-gray-50/50 dark:bg-gray-900/50 -mx-4 px-4 rounded-lg pt-4' : ''}`}>

                                {/* Thumbnail */}
                                <div className="w-full h-[150px] md:h-[150px] rounded-sm overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {post.thumbnail ? (
                                        <Image
                                            src={post.thumbnail}
                                            alt={post.title}
                                            width={200}
                                            height={150}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 group-hover:scale-105 transition-transform duration-500" />
                                    )}
                                </div>

                                {/* Content */}
                                <div>
                                    <div className="flex items-center gap-4 mb-2 text-xs tracking-[0.2em] uppercase font-sans">
                                        {post.tag.includes('pinned') && (
                                            <span className="text-red-500 font-bold flex items-center gap-1">
                                                📌 PINNED
                                            </span>
                                        )}
                                        <span className="text-gray-400">{post.date}</span>
                                        <span className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700" />
                                        <span className="text-gray-400">BY {post.authorName}</span>
                                        <span className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700" />
                                        <span className="text-gray-400">{post.tag}</span>
                                    </div>

                                    <Link href={`/blog/${post.slug}`}>
                                        <h2 className="text-3xl font-bold mb-2 group-hover:underline decoration-1 underline-offset-4 cursor-pointer">
                                            {post.title}
                                        </h2>
                                    </Link>

                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                </div>

                            </div>
                        ))}

                        {visibleCount < sortedPosts.length && (
                            <div ref={loaderRef} className="py-10 text-center text-gray-400 flex justify-center items-center gap-2 font-sans text-sm">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading more posts...</span>
                            </div>
                        )}

                        {sortedPosts.length === 0 && !loading && (
                            <p className="text-gray-500 text-center py-20 text-lg">
                                {query.trim() ? "No posts match your search." : "No posts yet."}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
