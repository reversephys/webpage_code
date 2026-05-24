"use client";

import { pb } from "@/lib/pocketbase";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Trash2, Plus, ExternalLink, Rss, Loader2, Search } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

interface Article {
    title: string;
    link: string;
    pubDate: string;
    isoDate: string;
    snippet: string;
    source: string;
    feedUrl?: string;
    imageUrl?: string | null;
    isHot?: boolean;
}

export default function NewsPage() {
    const { user } = useAuth();
    const [feeds, setFeeds] = useState<string[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    // Feed Management
    const [newFeedUrl, setNewFeedUrl] = useState("");
    const [addingFeed, setAddingFeed] = useState(false);

    const [visibleCount, setVisibleCount] = useState(10);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    const isNewArticle = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30); // 30 days ago
            return date >= oneMonthAgo;
        } catch {
            return false;
        }
    };

    const fetchFeedsAndArticles = async (showLoadingState = true) => {
        if (showLoadingState) setLoading(true);
        try {
            // Fetch feeds list
            const feedsRes = await fetch("/api/news/feeds");
            if (feedsRes.ok) {
                const feedsList = await feedsRes.json();
                setFeeds(feedsList);
            }

            // Fetch unified articles list
            const articlesRes = await fetch("/api/news/articles");
            if (articlesRes.ok) {
                const articlesList = await articlesRes.json();
                setArticles(articlesList);
            }
        } catch (error) {
            console.error("Failed to load feed data", error);
        } finally {
            if (showLoadingState) setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedsAndArticles();
    }, []);

    const handleAddFeed = async () => {
        if (!newFeedUrl.trim()) return;
        setAddingFeed(true);
        try {
            const res = await fetch("/api/news/feeds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({ url: newFeedUrl }),
            });
            if (res.ok) {
                setNewFeedUrl("");
                // Refresh both the feed list and articles
                await fetchFeedsAndArticles(true);
            } else {
                alert("Failed to add feed. Check URL or it might already exist.");
            }
        } catch (error) {
            alert("Error adding feed.");
        } finally {
            setAddingFeed(false);
        }
    };

    const handleRemoveFeed = async (url: string) => {
        if (!confirm(`Remove feed: ${url}?`)) return;
        try {
            const res = await fetch("/api/news/feeds", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({ url }),
            });
            if (res.ok) {
                // Refresh both the feed list and articles
                await fetchFeedsAndArticles(true);
            } else {
                alert("Failed to remove feed.");
            }
        } catch (error) {
            alert("Error removing feed.");
        }
    };

    const trackClick = async (article: Article) => {
        try {
            // Fire and forget
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

    const filteredArticles = query.trim()
        ? articles.filter((article) => {
            const q = query.toLowerCase();
            return (
                article.title.toLowerCase().includes(q) ||
                article.snippet.toLowerCase().includes(q) ||
                article.source.toLowerCase().includes(q)
            );
        })
        : articles;

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
    }, [filteredArticles.length, visibleCount]);

    const showSidebar = user && (user.permission_group || 0) >= 3;

    return (
        <main className="min-h-screen bg-background pt-32 pb-10 px-6 font-serif">
            <div className="max-w-6xl mx-auto">
                <header className="mb-2 flex items-center justify-between">
                    <h1 className="text-3xl md:text-5xl font-eczar tracking-tight">Feed</h1>
                </header>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-8 tracking-wide">
                    외부에서 발생하는 주요 이슈와 트렌드를 스크랩하고 확인하는 공간입니다.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
                    {/* Left Column: Unified Timeline (Blog Board Style) */}
                    <div className="space-y-8">
                        {/* Search bar */}
                        <div className="flex gap-2 max-w-2xl">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search articles by title, content, or source..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 font-sans">Loading feed articles...</p>
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                <p className="text-gray-500 mb-2 font-sans">No articles found.</p>
                                <p className="text-sm text-gray-400 font-sans">
                                    {query.trim() ? "Try searching for a different keyword." : "Add RSS feeds to populate the board."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {filteredArticles.slice(0, visibleCount).map((article, idx) => {
                                    const isNew = isNewArticle(article.isoDate || article.pubDate);
                                    const pubDateFormatted = article.isoDate || article.pubDate
                                        ? new Date(article.isoDate || article.pubDate).toLocaleDateString()
                                        : "";

                                    return (
                                        <article
                                            key={`${article.link}-${idx}`}
                                            className="group grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start border-b border-gray-150 dark:border-gray-800 pb-8 last:border-b-0"
                                        >
                                            {/* Left side: Thumbnail preview */}
                                            <div className="w-full h-[150px] rounded-sm overflow-hidden bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-center relative border border-gray-100 dark:border-neutral-800/80">
                                                {article.imageUrl ? (
                                                    <img
                                                        src={article.imageUrl}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const parent = e.currentTarget.parentElement;
                                                            if (parent) {
                                                                const fallback = parent.querySelector('.fallback-icon');
                                                                if (fallback) fallback.classList.remove('hidden');
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`fallback-icon ${article.imageUrl ? 'hidden' : ''} text-gray-300 dark:text-neutral-700`}>
                                                    <Rss className="w-8 h-8" />
                                                </div>
                                            </div>

                                            {/* Right side: Content */}
                                            <div className="flex flex-col h-full justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs tracking-wider uppercase font-sans">
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">{article.source}</span>
                                                        {pubDateFormatted && (
                                                            <>
                                                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                                                <time className="text-gray-400 dark:text-gray-500">{pubDateFormatted}</time>
                                                            </>
                                                        )}
                                                        {isNew && (
                                                            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-blue-500 text-white font-sans font-bold uppercase rounded tracking-widest leading-none">
                                                                NEW
                                                            </span>
                                                        )}
                                                        {article.isHot && (
                                                            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-orange-500 text-white font-sans font-bold uppercase rounded tracking-widest leading-none">
                                                                HOT
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl md:text-2xl font-bold mb-2 leading-snug">
                                                        <Link
                                                            href={article.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => trackClick(article)}
                                                            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline decoration-1 underline-offset-4 transition-colors"
                                                        >
                                                            {article.title}
                                                        </Link>
                                                    </h3>
                                                    
                                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 text-sm">
                                                        {article.snippet}
                                                    </p>
                                                </div>

                                                <div className="mt-4">
                                                    <Link
                                                        href={article.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => trackClick(article)}
                                                        className="inline-flex items-center text-xs font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors"
                                                    >
                                                        Read More <ExternalLink className="ml-1.5 w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}

                                {visibleCount < filteredArticles.length && (
                                    <div ref={loaderRef} className="py-10 text-center text-gray-400 flex justify-center items-center gap-2 font-sans text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Loading more articles...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Feed Manager (Only shown for permission >= 3) */}
                    {showSidebar ? (
                        <aside className="lg:sticky lg:top-32 w-full">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                                <h3 className="text-sm font-sans uppercase tracking-widest text-gray-500 mb-2 font-bold">Manage Feeds</h3>
                                <p className="text-xs text-gray-400 font-sans break-keep mb-6">
                                    RSS 피드의 주소(URL)를 추가하면, 해당 페이지의 최신 소식들이 좌측 목록에 자동으로 업데이트됩니다.
                                </p>
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="url"
                                        value={newFeedUrl}
                                        onChange={(e) => setNewFeedUrl(e.target.value)}
                                        placeholder="https://example.com/rss"
                                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 rounded"
                                    />
                                    <button
                                        onClick={handleAddFeed}
                                        disabled={addingFeed || !newFeedUrl}
                                        className="bg-foreground text-background px-3 py-2 rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {addingFeed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {feeds.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No feeds registered.</p>
                                    ) : (
                                        feeds.map((url) => (
                                            <div key={url} className="flex justify-between items-center group py-1 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]" title={url}>
                                                    {url}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveFeed(url)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </aside>
                    ) : null}
                </div>
            </div>
        </main>
    );
}
