"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface TrackedArticle {
    link: string;
    title: string;
    snippet: string;
    clicks: number;
    lastClickedAt: string;
}

export default function HotIssuesList({ issues }: { issues: TrackedArticle[] }) {
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
                    setVisibleCount((prev) => Math.min(prev + 5, issues.length));
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
    }, [isMobile, issues.length]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 5, issues.length));
    };

    const trackClick = async (article: TrackedArticle) => {
        try {
            fetch("/api/news/click", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    link: article.link,
                    title: article.title,
                    snippet: article.snippet || ""
                }),
            });
        } catch (e) {
            console.error("Tracking error", e);
        }
    };

    if (issues.length === 0) return null;

    const visibleIssues = issues.slice(0, visibleCount);

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
                <span className="block text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Hot Issues
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                    External Source
                </span>
            </div>

            <div className="space-y-8">
                {visibleIssues.map((issue, idx) => (
                    <Link
                        href={issue.link}
                        key={idx}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                        onClick={() => trackClick(issue)}
                    >
                        <h3 className="text-2xl font-bold font-serif mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {issue.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-2">
                            {issue.snippet}
                        </p>
                        {issue.clicks >= 10 && (
                            <div className="text-xs text-gray-400 font-sans uppercase tracking-wider">
                                {issue.clicks} Reads
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            {/* Load More Trigger */}
            {visibleCount < issues.length && (
                isMobile ? (
                    <div className="py-6 text-center flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            className="inline-flex items-center justify-center p-3 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Load more hot issues"
                        >
                            <ChevronDown className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                ) : (
                    <div ref={loaderRef} className="py-6 text-center text-sm text-gray-400">
                        Loading more issues...
                    </div>
                )
            )}
        </div>
    );
}
