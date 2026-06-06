"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface BlogPost {
    slug: string;
    title: string;
    date: string;
    rawDate: string;
    tag: string;
    userId: string;
    excerpt: string;
    thumbnail: string | null;
}

export default function LabLogsList({ posts }: { posts: BlogPost[] }) {
    const [visibleCount, setVisibleCount] = useState(5);
    const [isMobile, setIsMobile] = useState(false);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Detect mobile screens (width < 768px)
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Infinite scroll for desktop
    useEffect(() => {
        if (isMobile) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 5, posts.length));
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
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
    }, [isMobile, posts.length]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 5, posts.length));
    };

    if (posts.length === 0) {
        return (
            <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
                    <span className="block text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-foreground" />
                        Laboratory Logs
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">
                        Internal Research
                    </span>
                </div>
                <div className="group cursor-pointer">
                    <span className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Blog</span>
                    <h3 className="text-3xl font-serif font-bold mb-4">No posts yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Posts will appear here once content is added.
                    </p>
                </div>
            </div>
        );
    }

    const visiblePosts = posts.slice(0, visibleCount);

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
                <span className="block text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-foreground" />
                    Laboratory Logs
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                    Internal Research
                </span>
            </div>

            <div className="space-y-10">
                {visiblePosts.map((post, index) => (
                    <Link href={`/blog/${post.slug}`} key={post.slug} className="block">
                        <div className={`group cursor-pointer ${index > 0 ? 'pt-6 border-t border-gray-100 dark:border-gray-900' : ''}`}>
                            <span className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                                {post.tag}
                            </span>
                            <h3 className="text-2xl font-serif font-bold mb-2 group-hover:underline decoration-1 underline-offset-4">
                                {post.title}
                            </h3>
                            <div className="flex gap-6 items-stretch">
                                <p className="flex-1 min-w-0 text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {post.excerpt}
                                </p>
                                {post.thumbnail && (
                                    <div className="w-[120px] shrink-0 relative overflow-hidden rounded-sm">
                                        <Image
                                            src={post.thumbnail}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/0 transition-colors" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Load More Trigger */}
            {visibleCount < posts.length && (
                isMobile ? (
                    <div className="py-6 text-center flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            className="inline-flex items-center justify-center p-3 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Load more posts"
                        >
                            <ChevronDown className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                ) : (
                    <div ref={loaderRef} className="py-6 text-center text-sm text-gray-400">
                        Loading more posts...
                    </div>
                )
            )}
        </div>
    );
}
