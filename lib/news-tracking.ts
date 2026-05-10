import fs from "fs";
import path from "path";

export interface TrackedArticle {
    link: string;
    title: string;
    snippet: string;
    clicks: number;
    lastClickedAt: string;
}

const TRACKING_FILE = path.join(process.cwd(), "..", "Contents", "News", "hot_issues.json");
const NEWS_DIR = path.join(process.cwd(), "..", "Contents", "News");

// Ensure directory exists
if (!fs.existsSync(NEWS_DIR)) {
    fs.mkdirSync(NEWS_DIR, { recursive: true });
}

export function getTrackedArticles(): TrackedArticle[] {
    if (!fs.existsSync(TRACKING_FILE)) return [];
    try {
        const data = fs.readFileSync(TRACKING_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export function trackClick(article: { link: string; title: string; snippet: string }) {
    const articles = getTrackedArticles();
    const index = articles.findIndex((a) => a.link === article.link);

    if (index >= 0) {
        articles[index].clicks += 1;
        articles[index].lastClickedAt = new Date().toISOString();
        // Update metadata in case it changed
        articles[index].title = article.title;
        articles[index].snippet = article.snippet;
    } else {
        articles.push({
            ...article,
            clicks: 1,
            lastClickedAt: new Date().toISOString(),
        });
    }

    fs.writeFileSync(TRACKING_FILE, JSON.stringify(articles, null, 2));
}

export function getTopIssues(limit: number = 2): TrackedArticle[] {
    const articles = getTrackedArticles();

    // Filter out articles older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeArticles = articles.filter(a => {
        const lastClicked = new Date(a.lastClickedAt);
        return lastClicked >= sevenDaysAgo;
    });

    // Save back if any articles were pruned
    if (activeArticles.length < articles.length) {
        fs.writeFileSync(TRACKING_FILE, JSON.stringify(activeArticles, null, 2));
    }

    // Sort by clicks descending
    return activeArticles
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, limit);
}
