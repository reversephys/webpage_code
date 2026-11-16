import fs from "fs";
import path from "path";
import { CONTENTS_DIR, getAllPosts, type BlogPost } from "./blog";
import {
    KNOWLEDGE_AREAS,
    KNOWLEDGE_SUBJECTS,
    META_TAGS,
    UNSORTED_AREA,
    UNSORTED_SUBJECT,
    type KnowledgeGraph,
    type KnowledgeNote,
} from "./knowledge-map";

/**
 * Two posts sharing a tag are drawn as linked, but only while the tag is
 * specific. A tag on more posts than this is a category rather than a
 * relation: it still appears on the map as a tag, without the links.
 */
const MAX_LINKED_TAG_SIZE = 6;

/** Ring labels longer than this (a Hangul syllable counts as two) are cut. */
const LABEL_WIDTH = 20;

const normalize = (tag: string) => tag.trim().toLowerCase();

function topicTags(post: BlogPost): string[] {
    return post.tag
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag && !META_TAGS.includes(normalize(tag)));
}

// Hangul, CJK and full-width forms: about twice as wide as a Latin letter.
const WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFF00-\uFF60\uFFE0-\uFFE6]/;

function cutToWidth(text: string, width: number): string {
    let used = 0;
    let out = "";
    for (const ch of text) {
        used += WIDE.test(ch) ? 2 : 1;
        if (used > width) return out.trimEnd() + "…";
        out += ch;
    }
    return out;
}

/**
 * Ring labels for the posts of one subject. Posts of a series start with the
 * same words ("이동통신 LAB 구축 시리즈 ..."), which would make their labels
 * identical once cut, so a prefix of two or more words shared with another
 * post of the subject is dropped first.
 */
function ringLabels(titles: string[]): string[] {
    const words = titles.map((title) => title.split(/\s+/).filter(Boolean));
    return words.map((own, i) => {
        let shared = 0;
        words.forEach((other, j) => {
            if (i === j) return;
            let k = 0;
            while (k < own.length && k < other.length && own[k] === other[k]) k++;
            if (k >= 2 && k > shared) shared = k;
        });
        const rest = shared < own.length ? own.slice(shared) : own;
        return cutToWidth(rest.join(" "), LABEL_WIDTH);
    });
}

/**
 * Every post's markdown by slug, in one pass over the post folders. Looking
 * each post up on its own would scan all the folders once per post.
 */
function readPostBodies(): Map<string, string> {
    const bodies = new Map<string, string>();
    if (!fs.existsSync(CONTENTS_DIR)) return bodies;
    for (const entry of fs.readdirSync(CONTENTS_DIR, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
        const folder = path.join(CONTENTS_DIR, entry.name);
        const file = fs.readdirSync(folder).find((name) => name.endsWith(".md"));
        if (file) bodies.set(file.replace(/\.md$/, ""), fs.readFileSync(path.join(folder, file), "utf-8"));
    }
    return bodies;
}

/**
 * The knowledge map of the given posts: each post under a subject, the tags
 * shared by several posts, and the links between posts. `bodies` holds the
 * posts' markdown by slug.
 */
export function buildKnowledgeGraph(posts: BlogPost[], bodies: Map<string, string>): KnowledgeGraph {
    const subjectOfTag = new Map<string, string>();
    for (const subject of KNOWLEDGE_SUBJECTS) {
        for (const tag of subject.tags) subjectOfTag.set(normalize(tag), subject.id);
    }

    // Tags used by two or more posts, under the spelling most authors used.
    const spellings = new Map<string, Map<string, number>>();
    const postsOfTag = new Map<string, string[]>();
    for (const post of posts) {
        for (const tag of new Set(topicTags(post).map(normalize))) {
            postsOfTag.set(tag, [...(postsOfTag.get(tag) ?? []), post.slug]);
        }
        for (const tag of topicTags(post)) {
            const counts = spellings.get(normalize(tag)) ?? new Map<string, number>();
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
            spellings.set(normalize(tag), counts);
        }
    }
    const threadId = (tag: string) => tag.replace(/\s+/g, "-");
    const sharedTags = [...postsOfTag.entries()].filter(([, slugs]) => slugs.length >= 2);
    const threads = sharedTags
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
        .map(([tag]) => {
            const [spelling] = [...spellings.get(tag)!.entries()].sort((a, b) => b[1] - a[1])[0];
            return { id: threadId(tag), mark: `#${spelling}` };
        });
    const isShared = new Set(sharedTags.map(([tag]) => tag));

    // Notes, grouped by subject in the vocabulary's order, newest first.
    const subjectOf = (post: BlogPost) => {
        for (const tag of topicTags(post)) {
            const subject = subjectOfTag.get(normalize(tag));
            if (subject) return subject;
        }
        return UNSORTED_SUBJECT.id;
    };
    const bySubject = new Map<string, BlogPost[]>();
    for (const post of posts) {
        const subject = subjectOf(post);
        bySubject.set(subject, [...(bySubject.get(subject) ?? []), post]);
    }
    const unsorted = bySubject.has(UNSORTED_SUBJECT.id);
    const subjects = unsorted ? [...KNOWLEDGE_SUBJECTS, UNSORTED_SUBJECT] : KNOWLEDGE_SUBJECTS;
    const areas = unsorted ? [...KNOWLEDGE_AREAS, UNSORTED_AREA] : KNOWLEDGE_AREAS;

    const notes: KnowledgeNote[] = [];
    for (const subject of subjects) {
        const group = (bySubject.get(subject.id) ?? [])
            .slice()
            .sort((a, b) => b.rawDate.localeCompare(a.rawDate));
        const labels = ringLabels(group.map((post) => post.title));
        group.forEach((post, i) => {
            notes.push({
                slug: post.slug,
                subject: subject.id,
                title: post.title,
                short: labels[i],
                summary: post.excerpt,
                date: post.date,
                threads: [...new Set(topicTags(post).map(normalize))].filter((tag) => isShared.has(tag)).map(threadId),
                url: `/blog/${post.slug}`,
            });
        });
    }

    // Links: a post that links to another post, and posts sharing a specific tag.
    const known = new Set(posts.map((post) => post.slug));
    const links = new Map<string, [string, string]>();
    const link = (a: string, b: string) => {
        if (a === b) return;
        const pair: [string, string] = a < b ? [a, b] : [b, a];
        links.set(pair.join("|"), pair);
    };
    for (const post of posts) {
        const body = bodies.get(post.slug) ?? "";
        for (const match of body.matchAll(/\/blog\/([A-Za-z0-9-]+)/g)) {
            if (known.has(match[1])) link(post.slug, match[1]);
        }
    }
    for (const [, slugs] of sharedTags) {
        if (slugs.length > MAX_LINKED_TAG_SIZE) continue;
        slugs.forEach((a, i) => slugs.slice(i + 1).forEach((b) => link(a, b)));
    }

    return {
        areas: areas.map((area) => ({ id: area.id, name: area.name, home: !!area.home })),
        subjects: subjects.map((subject) => ({ id: subject.id, area: subject.area, name: subject.name })),
        threads,
        notes,
        links: [...links.values()],
    };
}

/**
 * The map a visitor may see: members get every post, everyone else only the
 * posts tagged `public` (the same rule as the post list).
 */
export async function getKnowledgeGraph(hasAccess: boolean): Promise<KnowledgeGraph> {
    const posts = await getAllPosts();
    const visible = hasAccess
        ? posts
        : posts.filter((post) => post.tag.split(",").map((tag) => tag.trim()).includes("public"));
    return buildKnowledgeGraph(visible, readPostBodies());
}
