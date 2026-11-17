"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mountKnowledgeRing, type RingHandle } from "@/lib/knowledge-ring";
import type { KnowledgeGraph } from "@/lib/knowledge-map";

/** Tag buttons shown before "more": the most used tags come first. */
const TAG_LIMIT = 12;

/**
 * The ring of the knowledge map, with the tags that pick posts on it and the
 * two status lines above it. The SVG and the status lines are drawn by
 * lib/knowledge-ring.ts (styled in app/knowledge/knowledge.css); React only
 * owns the tag buttons.
 */
export function KnowledgeRing({ graph }: { graph: KnowledgeGraph }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<RingHandle | null>(null);
    const [pinnedTag, setPinnedTag] = useState<string | null>(null);
    const [showAllTags, setShowAllTags] = useState(false);

    useEffect(() => {
        if (!rootRef.current) return;
        const ring = mountKnowledgeRing(rootRef.current, graph, (pick) => {
            setPinnedTag(pick?.kind === "thread" ? pick.id : null);
        });
        ringRef.current = ring;
        return () => {
            ring.destroy();
            ringRef.current = null;
        };
    }, [graph]);

    const postsOfTag = (id: string) => graph.notes.filter((note) => note.threads.includes(id)).length;
    // A picked tag stays visible even when it is past the limit (?thread= can pick any).
    const tags = showAllTags
        ? graph.threads
        : graph.threads.filter((thread, i) => i < TAG_LIMIT || thread.id === pinnedTag);
    // What the status lines say before the ring has drawn. The ring rewrites them
    // afterwards, so the object must stay the same one: React sets the HTML
    // again whenever it gets a new object, even with the same text.
    const restingStatus = useMemo(
        () => ({ __html: `<p class="l1">글 ${graph.notes.length}</p><p class="l2">&nbsp;</p>` }),
        [graph.notes.length]
    );

    return (
        <div ref={rootRef} className="ring-stage">
            {graph.threads.length > 0 && (
                <div role="group" aria-label="여러 글이 함께 쓰는 태그" className="flex flex-wrap gap-2">
                    {tags.map((thread) => {
                        const picked = pinnedTag === thread.id;
                        return (
                            <button
                                key={thread.id}
                                type="button"
                                aria-pressed={picked}
                                onClick={() => ringRef.current?.pinThread(picked ? null : thread.id)}
                                className={`px-3 py-1.5 border text-xs font-sans uppercase tracking-widest transition-colors ${picked
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-foreground hover:bg-foreground hover:text-background"
                                    }`}
                            >
                                {thread.mark}
                                <span className="ml-2 opacity-60">{postsOfTag(thread.id)}</span>
                            </button>
                        );
                    })}
                    {graph.threads.length > TAG_LIMIT && (
                        <button
                            type="button"
                            aria-expanded={showAllTags}
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="px-2 py-1.5 text-xs font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors"
                        >
                            {showAllTags ? "접기" : `+${graph.threads.length - tags.length} 더 보기`}
                        </button>
                    )}
                </div>
            )}
            <div className="ring-status">
                <div className="ring-info" aria-live="polite" dangerouslySetInnerHTML={restingStatus} />
            </div>
            <div className="ringmap">
                <svg className="ring-svg" role="group" aria-label="글 지도: 둘레에 주제별로 글, 안쪽 곡선이 글 사이의 연결" />
            </div>
        </div>
    );
}
