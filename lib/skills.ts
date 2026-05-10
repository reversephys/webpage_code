import fs from "fs";
import path from "path";

export interface Skill {
    title: string;
    content: string;
    userId?: string;
    authorName?: string;
    slug?: string;
}

const SKILLS_DIR = path.join(process.cwd(), "..", "Contents", "SKILLS");

// Ensure directory exists
if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

export function getAllSkills(): Skill[] {
    if (!fs.existsSync(SKILLS_DIR)) return [];

    const folders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory());

    const skills: Skill[] = [];

    for (const folder of folders) {
        const folderPath = path.join(SKILLS_DIR, folder.name);
        const files = fs.readdirSync(folderPath);
        const mdFile = files.find((f) => f.endsWith(".md"));
        if (!mdFile) continue;

        const slug = mdFile.replace(/\.md$/, "");
        const content = fs.readFileSync(path.join(folderPath, mdFile), "utf-8");

        // Format: YYYYMMDDHHMMSS_userId_title
        const match = folder.name.match(/^(\d{14})_([^_]+)_(.+)$/i);
        if (!match) continue;

        const userId = match[2];
        const title = match[3].replace(/-/g, " ");

        skills.push({ title, content, userId, slug });
    }
    return skills;
}

export function getSkillBySlug(slug: string): Skill | null {
    if (!fs.existsSync(SKILLS_DIR)) return null;

    const folders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory());

    for (const folder of folders) {
        const mdPath = path.join(SKILLS_DIR, folder.name, `${slug}.md`);
        if (!fs.existsSync(mdPath)) continue;

        const match = folder.name.match(/^(\d{14})_([^_]+)_(.+)$/i);
        if (!match) continue;

        const title = match[3].replace(/-/g, " ");
        const content = fs.readFileSync(mdPath, "utf-8");
        const userId = match[2];

        return { title, content, userId, slug };
    }
    return null;
}

export function getSkillFolderName(slug: string): string | null {
    if (!fs.existsSync(SKILLS_DIR)) return null;

    const folders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory());

    for (const folder of folders) {
        const mdPath = path.join(SKILLS_DIR, folder.name, `${slug}.md`);
        if (fs.existsSync(mdPath)) {
            return folder.name;
        }
    }
    return null;
}

export function getSkillByTitle(title: string): Skill | null {
    if (!fs.existsSync(SKILLS_DIR)) return null;

    const folders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory());

    for (const folder of folders) {
        // Format: YYYYMMDDHHMMSS_userId_title
        const match = folder.name.match(/^(\d{14})_([^_]+)_(.+)$/i);
        if (!match) continue;

        const currentTitle = match[3].replace(/-/g, " ");
        if (currentTitle === title) {
            const folderPath = path.join(SKILLS_DIR, folder.name);
            const files = fs.readdirSync(folderPath);
            const mdFile = files.find((f) => f.endsWith(".md"));
            if (!mdFile) continue;

            const slug = mdFile.replace(/\.md$/, "");
            const content = fs.readFileSync(path.join(folderPath, mdFile), "utf-8");
            const userId = match[2];

            return { title, content, userId, slug };
        }
    }
    return null;
}

export { SKILLS_DIR };
