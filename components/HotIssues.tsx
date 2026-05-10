"use client";

import Link from "next/link";

interface TrackedArticle {
    link: string;
    title: string;
    snippet: string;
    clicks: number;
    lastClickedAt: string;
}

export default function HotIssues({ issues }: { issues: TrackedArticle[] }) {
    if (issues.length === 0) return null;

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

    return (
        <div className="mb-16">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-10 flex items-center justify-between">
                <span className="block text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Hot Issues
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                    External Source
                </span>
            </div>

            <div className="space-y-8">
                {issues.map((issue, idx) => (
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
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
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
        </div>
    );
}
