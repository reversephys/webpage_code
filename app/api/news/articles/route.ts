import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { getFeeds, getCachedArticles, saveArticlesCache } from "@/lib/news";

export const dynamic = 'force-dynamic'; // Ensure no caching at the Next.js level, using custom caching

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
            ['image', 'image'],
        ]
    }
});

function extractImage(item: any): string | null {
    // 1. Check enclosure
    if (item.enclosure && item.enclosure.url) {
        const url = item.enclosure.url;
        if (!item.enclosure.type || item.enclosure.type.startsWith("image/") || /\.(jpeg|jpg|gif|png|webp|svg)/i.test(url)) {
            return url;
        }
    }

    // 2. Check mediaContent / media:content
    const mediaContent = item.mediaContent || item['media:content'];
    if (mediaContent) {
        if (Array.isArray(mediaContent) && mediaContent.length > 0) {
            const first = mediaContent[0];
            if (first) {
                if (first.$ && first.$.url) return first.$.url;
                if (first.url) return first.url;
            }
        } else if (typeof mediaContent === 'object') {
            if (mediaContent.$ && mediaContent.$.url) return mediaContent.$.url;
            if (mediaContent.url) return mediaContent.url;
        }
    }

    // 3. Check mediaThumbnail / media:thumbnail
    const mediaThumbnail = item.mediaThumbnail || item['media:thumbnail'];
    if (mediaThumbnail) {
        if (mediaThumbnail.$ && mediaThumbnail.$.url) return mediaThumbnail.$.url;
        if (mediaThumbnail.url) return mediaThumbnail.url;
    }

    // 4. Regex search in content, content:encoded, description
    const htmlContent = item.content || item['content:encoded'] || item.description || "";
    if (htmlContent) {
        const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');

    let allArticles: any[] = [];
    let fromCache = false;

    // If fetching all feeds, check the 24-hour server cache
    if (!urlParam) {
        const cached = getCachedArticles();
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            allArticles = cached.articles;
            fromCache = true;
        }
    }

    if (!fromCache) {
        const feedsToFetch = urlParam ? [urlParam] : getFeeds();

        await Promise.all(feedsToFetch.map(async (url) => {
            try {
                const feed = await parser.parseURL(url);
                feed.items.forEach((item) => {
                    const imageUrl = extractImage(item);
                    allArticles.push({
                        title: item.title || "Untitled",
                        link: item.link || "",
                        pubDate: item.pubDate || "",
                        isoDate: item.isoDate || "",
                        snippet: item.contentSnippet || item.summary || "",
                        source: feed.title || url,
                        feedUrl: url,
                        imageUrl: imageUrl,
                    });
                });
            } catch (error) {
                console.error(`Failed to parse feed: ${url}`, error);
            }
        }));

        // Sort by date descending
        allArticles.sort((a, b) => {
            const dateA = new Date(a.isoDate || a.pubDate || 0).getTime();
            const dateB = new Date(b.isoDate || b.pubDate || 0).getTime();
            return dateB - dateA;
        });

        // Save to cache if loading all feeds
        if (!urlParam) {
            saveArticlesCache(allArticles);
        }
    }

    // Attach isHot flag dynamically
    try {
        const { getTopIssues } = require("@/lib/news-tracking");
        const topIssues = getTopIssues(10); // Check top 10 for hot badges
        const hotLinks = new Set(topIssues.map((i: any) => i.link));

        const articlesWithHot = allArticles.map(a => ({
            ...a,
            isHot: hotLinks.has(a.link)
        }));

        return NextResponse.json(articlesWithHot);
    } catch (e) {
        console.error("Error attaching isHot flag:", e);
        return NextResponse.json(allArticles);
    }
}
