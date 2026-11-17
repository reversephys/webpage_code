/**
 * The knowledge map's vocabulary: which areas and subjects there are, and
 * which post tags put a post in a subject. Edit this file to regroup the map
 * (/knowledge); nothing else needs to change.
 *
 * - areas     the ring's sectors. `home: true` marks the lab's own field:
 *             links from it to the other areas are drawn darkest.
 * - subjects  a post joins the subject of the first of its tags that is
 *             listed here (in the order the author typed them). Tags are
 *             compared case-insensitively, and each tag belongs to one
 *             subject only.
 *
 * A post none of whose tags is listed goes to "미분류". A tag used by two or
 * more posts also shows up on the map by itself, so nothing has to be
 * declared for that.
 */

export interface KnowledgeArea {
    id: string;
    name: string;
    home?: boolean;
}

export interface KnowledgeSubject {
    id: string;
    area: string;
    name: string;
    tags: string[];
}

export const KNOWLEDGE_AREAS: KnowledgeArea[] = [
    { id: "hardware", name: "하드웨어", home: true },
    { id: "wireless", name: "무선통신" },
    { id: "embedded", name: "임베디드" },
    { id: "system", name: "시스템" },
    { id: "ai", name: "AI" },
];

export const KNOWLEDGE_SUBJECTS: KnowledgeSubject[] = [
    {
        id: "fault-injection",
        area: "hardware",
        name: "결함 주입",
        tags: ["glitching", "chipwhisperer", "phywhisperer", "yubikey", "oscilloscope"],
    },
    {
        id: "hardware-trust",
        area: "hardware",
        name: "하드웨어 신뢰",
        tags: ["hardware trojan", "countermeasures"],
    },
    {
        id: "cellular",
        area: "wireless",
        name: "이동통신",
        tags: [
            "5g", "5g-sa", "ocudu", "open5gs", "sdr", "mobile-network", "ran",
            "core-network", "cellular", "cellular security",
        ],
    },
    {
        id: "automotive",
        area: "embedded",
        name: "자동차",
        tags: ["car-hacking", "can", "uds"],
    },
    {
        id: "consumer",
        area: "embedded",
        name: "가전",
        tags: ["smarttv"],
    },
    {
        id: "kernel",
        area: "system",
        name: "커널",
        tags: ["kernel", "linux", "lpe"],
    },
    {
        id: "browser",
        area: "system",
        name: "브라우저",
        tags: ["browser", "v8", "chrome"],
    },
    {
        id: "isolation",
        area: "system",
        name: "격리와 TEE",
        tags: ["tee", "intel tdx", "amd sev-snp", "confidential computing", "risc-v", "pmp"],
    },
    {
        id: "ai-security",
        area: "ai",
        name: "AI 보안",
        tags: ["ai security", "remote prompt execution"],
    },
];

/** Where posts without a listed tag go. Added to the map only when needed. */
export const UNSORTED_AREA: KnowledgeArea = { id: "etc", name: "기타" };
export const UNSORTED_SUBJECT: KnowledgeSubject = { id: "unsorted", area: "etc", name: "미분류", tags: [] };

/** Tags that say how a post is shown, not what it is about. */
export const META_TAGS = ["public", "pinned"];

/* ---- what the page and the ring are drawn from ---- */

export interface KnowledgeNote {
    slug: string;
    subject: string;
    title: string;
    /** Label on the ring: the title without a shared series prefix, cut to fit. */
    short: string;
    summary: string;
    /** As the post list shows it: "Oct 15, 2026". */
    date: string;
    threads: string[];
    url: string;
}

export interface KnowledgeThread {
    id: string;
    /** The tag as its authors wrote it, with a leading #. */
    mark: string;
}

export interface KnowledgeGraph {
    areas: { id: string; name: string; home: boolean }[];
    subjects: { id: string; area: string; name: string }[];
    threads: KnowledgeThread[];
    notes: KnowledgeNote[];
    /** Pairs of slugs: one post links to the other, or they share a tag. */
    links: [string, string][];
}
