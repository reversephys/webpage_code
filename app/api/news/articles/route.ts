import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { getFeeds } from "@/lib/news";

export const dynamic = 'force-dynamic'; // Ensure no caching for latest news

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');

    const parser = new Parser();
    const feedsToFetch = urlParam ? [urlParam] : getFeeds();

    const allArticles: any[] = [];

    await Promise.all(feedsToFetch.map(async (url) => {
        try {
            const feed = await parser.parseURL(url);
            feed.items.forEach((item) => {
                allArticles.push({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    isoDate: item.isoDate,
                    snippet: item.contentSnippet || item.summary || "",
                    source: feed.title || url,
                    feedUrl: url, // Include feed URL for matching
                });
            });
        } catch (error) {
            console.error(`Failed to parse feed: ${url}`, error);
            // Return empty for this feed but don't crash
        }
    }));

    // Sort by date descending
    allArticles.sort((a, b) => {
        const dateA = new Date(a.isoDate || a.pubDate || 0).getTime();
        const dateB = new Date(b.isoDate || b.pubDate || 0).getTime();
        return dateB - dateA;
    });

    return NextResponse.json(allArticles);
}
