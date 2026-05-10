import fs from "fs";
import path from "path";

const CONTENTS_DIR = path.join(process.cwd(), "..", "Contents", "ACHIEVEMENTS");

export function getAchievementsContent(): string | null {
    if (!fs.existsSync(CONTENTS_DIR)) return null;

    const mdPath = path.join(CONTENTS_DIR, "ACHIEVEMENTS.md");
    if (!fs.existsSync(mdPath)) return null;

    const rawContent = fs.readFileSync(mdPath, "utf-8");

    // Replace relative image references (images/filename.png) with the API route
    const content = rawContent.replace(
        /src="images\/([^"]+)"/g,
        `src="/api/achievements-image/$1"`
    ).replace(
        /!\[([^\]]*)\]\(images\/([^)]+)\)/g,
        `![$1](/api/achievements-image/$2)`
    );

    return content;
}
