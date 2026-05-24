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
    
    // 1. 오래된 데이터 먼저 필터링 (30일 기준)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    let activeArticles = articles.filter(a => {
        const lastClicked = new Date(a.lastClickedAt);
        return lastClicked >= oneMonthAgo;
    });

    const index = activeArticles.findIndex((a) => a.link === article.link);

    if (index >= 0) {
        activeArticles[index].clicks += 1;
        activeArticles[index].lastClickedAt = new Date().toISOString();
        // Update metadata in case it changed
        activeArticles[index].title = article.title;
        activeArticles[index].snippet = article.snippet;
    } else {
        activeArticles.push({
            ...article,
            clicks: 1,
            lastClickedAt: new Date().toISOString(),
        });
    }

    // 2. 클릭수 기준으로 정렬
    activeArticles.sort((a, b) => b.clicks - a.clicks);

    // 3. 파일 저장 개수 제한 (새로운 글이 클릭수를 누적할 수 있도록 파일에는 여유있게 100개까지만 저장)
    activeArticles = activeArticles.slice(0, 100);

    fs.writeFileSync(TRACKING_FILE, JSON.stringify(activeArticles, null, 2));
}

export function getTopIssues(limit: number = 10): TrackedArticle[] {
    const articles = getTrackedArticles();

    // Filter out articles older than 30 days
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const activeArticles = articles.filter(a => {
        const lastClicked = new Date(a.lastClickedAt);
        return lastClicked >= oneMonthAgo;
    });

    // Save back if any articles were pruned
    if (activeArticles.length < articles.length) {
        fs.writeFileSync(TRACKING_FILE, JSON.stringify(activeArticles, null, 2));
    }

    // Sort by clicks descending and return the requested limit
    return activeArticles
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, limit);
}
