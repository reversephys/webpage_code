import fs from "fs";
import path from "path";

const RSS_FILE = path.join(process.cwd(), "..", "Contents", "rss.json");

// Ensure directory exists
const CONTENTS_DIR = path.join(process.cwd(), "..", "Contents");
if (!fs.existsSync(CONTENTS_DIR)) {
    fs.mkdirSync(CONTENTS_DIR, { recursive: true });
}

export function getFeeds(): string[] {
    if (!fs.existsSync(RSS_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(RSS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export function addFeed(url: string): boolean {
    const feeds = getFeeds();
    if (feeds.includes(url)) return false;

    feeds.push(url);
    fs.writeFileSync(RSS_FILE, JSON.stringify(feeds, null, 2));
    return true;
}

export function removeFeed(url: string): boolean {
    const feeds = getFeeds();
    const newFeeds = feeds.filter((f) => f !== url);

    if (newFeeds.length === feeds.length) return false;

    fs.writeFileSync(RSS_FILE, JSON.stringify(newFeeds, null, 2));
    return true;
}
