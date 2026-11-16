import Link from "next/link";
import { KnowledgeRing } from "@/components/KnowledgeRing";
import { getServerUserFromCookie } from "@/lib/auth-server";
import { getKnowledgeGraph } from "@/lib/knowledge";
import type { KnowledgeNote } from "@/lib/knowledge-map";
import "./knowledge.css";

/** Posts listed under a subject before "more": the newest come first. */
const INDEX_LIMIT = 8;

function PostList({ notes, className = "" }: { notes: KnowledgeNote[]; className?: string }) {
    return (
        <ul className={`space-y-5 ${className}`}>
            {notes.map((note) => (
                <li key={note.slug}>
                    <Link href={note.url} className="block group">
                        <span className="block mb-1 text-xs font-sans tracking-[0.2em] uppercase text-gray-400">
                            {note.date}
                        </span>
                        <h3 className="text-xl font-bold leading-snug break-keep group-hover:underline decoration-1 underline-offset-4">
                            {note.title}
                        </h3>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/**
 * The knowledge map: every blog post on one ring, grouped by subject, with
 * the links between posts, and one list per subject below. How posts are
 * grouped is set in lib/knowledge-map.ts.
 */
export default async function KnowledgePage() {
    const user = await getServerUserFromCookie();
    const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
    const graph = await getKnowledgeGraph(permGroup >= 3);

    const areaName = new Map(graph.areas.map((area) => [area.id, area.name]));
    const groups = graph.subjects
        .map((subject) => ({ subject, notes: graph.notes.filter((note) => note.subject === subject.id) }))
        .filter((group) => group.notes.length > 0);

    return (
        <main className="kb min-h-screen bg-background pt-32 pb-10 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-eczar tracking-tight mb-2">Knowledge</h1>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-8 tracking-wide break-keep">
                    블로그 글을 주제별로 모으고, 글 사이의 연결을 그린 지도입니다.
                </p>

                {graph.notes.length === 0 ? (
                    <p className="text-gray-500 text-center py-20 text-lg">No posts yet.</p>
                ) : (
                    <>
                        <KnowledgeRing graph={graph} />

                        {/* Works without JavaScript too: every post is listed here. */}
                        <section aria-label="주제별 글 목록" className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14 mt-16">
                            {groups.map(({ subject, notes }) => (
                                <div key={subject.id}>
                                    <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
                                        <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-foreground" />
                                            {subject.name}
                                            <span className="font-normal text-gray-400">{notes.length}</span>
                                        </h2>
                                        <span className="text-xs font-sans text-gray-400 uppercase tracking-widest">
                                            {areaName.get(subject.area)}
                                        </span>
                                    </div>
                                    <PostList notes={notes.slice(0, INDEX_LIMIT)} />
                                    {notes.length > INDEX_LIMIT && (
                                        <details className="group mt-5">
                                            <summary className="cursor-pointer list-none text-xs font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden">
                                                <span className="group-open:hidden">+{notes.length - INDEX_LIMIT} 더 보기</span>
                                                <span className="hidden group-open:inline">접기</span>
                                            </summary>
                                            <PostList notes={notes.slice(INDEX_LIMIT)} className="mt-5" />
                                        </details>
                                    )}
                                </div>
                            ))}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
