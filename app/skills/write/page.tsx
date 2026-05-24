"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthContext";

type Tab = "write" | "preview";

const TOOLBAR_ACTIONS = [
    { label: "B", title: "Bold", prefix: "**", suffix: "**", placeholder: "bold text" },
    { label: "I", title: "Italic", prefix: "_", suffix: "_", placeholder: "italic text" },
    { label: "S", title: "Strikethrough", prefix: "~~", suffix: "~~", placeholder: "strikethrough" },
    { label: "H1", title: "Heading 1", prefix: "# ", suffix: "", placeholder: "heading", newline: true },
    { label: "H2", title: "Heading 2", prefix: "## ", suffix: "", placeholder: "heading", newline: true },
    { label: "H3", title: "Heading 3", prefix: "### ", suffix: "", placeholder: "heading", newline: true },
    { label: "<>", title: "Inline Code", prefix: "`", suffix: "`", placeholder: "code" },
    { label: "```", title: "Code Block", prefix: "```\n", suffix: "\n```", placeholder: "code block", newline: true },
    { label: "—", title: "Horizontal Rule", prefix: "\n---\n", suffix: "", placeholder: "" },
    { label: "🔗", title: "Link", prefix: "[", suffix: "](url)", placeholder: "link text" },
    { label: "•", title: "Bullet List", prefix: "- ", suffix: "", placeholder: "list item", newline: true },
    { label: "1.", title: "Numbered List", prefix: "1. ", suffix: "", placeholder: "list item", newline: true },
    { label: ">", title: "Blockquote", prefix: "> ", suffix: "", placeholder: "quote", newline: true },
];

function SkillsWriteEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editSlug = searchParams.get("edit");
    const { user, loading: authLoading } = useAuth();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<Tab>("write");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
            } else if ((user.permission_group || 0) < 3) {
                router.push("/");
            }
        }
    }, [user, authLoading, router]);

    // Load existing skill data
    useEffect(() => {
        if (!user || !editSlug) return;

        (async () => {
            try {
                const res = await fetch("/api/skills/list");
                const skills = await res.json();
                const skill = skills.find((s: any) => s.slug === editSlug);
                if (skill) {
                    setTitle(skill.title);
                    setContent(skill.content);
                } else {
                    setError("Skill not found.");
                }
            } catch {
                setError("Failed to load skill.");
            }
        })();
    }, [editSlug, user]);

    const insertToolbar = useCallback((action: typeof TOOLBAR_ACTIONS[0]) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.slice(start, end) || action.placeholder;

        let insertion = `${action.prefix}${selected}${action.suffix}`;

        if (action.newline && start > 0 && content[start - 1] !== "\n") {
            insertion = "\n" + insertion;
        }

        const newContent = content.slice(0, start) + insertion + content.slice(end);
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            const cursorPos = start + action.prefix.length + (action.newline && start > 0 && content[start - 1] !== "\n" ? 1 : 0);
            const cursorEnd = cursorPos + selected.length;
            textarea.setSelectionRange(cursorPos, cursorEnd);
        }, 0);
    }, [content]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-4xl mx-auto text-center text-gray-400">Loading...</div>
            </main>
        );
    }

    if (!user) return null;

    const handlePublish = async () => {
        if (!title.trim()) { setError("Title is required."); return; }
        if (!content.trim()) { setError("Content is required."); return; }

        setPublishing(true);
        setError(null);

        try {
            const url = editSlug ? "/api/skills/edit" : "/api/skills/publish";
            const body = editSlug
                ? { slug: editSlug, newTitle: title, content }
                : { title, content };

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.redirect) {
                router.push(data.redirect);
                return;
            }
            if (!res.ok) setError(data.error || "Failed to save.");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setPublishing(false);
        }
    };



    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/skills"
                    className="inline-flex items-center text-sm font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Skills
                </Link>

                <div className="flex justify-between items-center mb-12">
                    {!editSlug && (
                        <h1 className="text-5xl md:text-7xl font-eczar tracking-tight">
                            New Skill
                        </h1>
                    )}

                </div>

                <div className="mb-6">
                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Skill Name (e.g. Reverse-Engineering)"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-lg font-serif focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                </div>

                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        {TOOLBAR_ACTIONS.map((action) => (
                            <button
                                key={action.title}
                                title={action.title}
                                onClick={() => { setTab("write"); insertToolbar(action); }}
                                className="px-2.5 py-1.5 text-xs font-mono text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setTab("write")}
                            className={`flex-1 py-3 text-sm font-sans uppercase tracking-widest text-center transition-colors ${tab === "write" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Write
                        </button>
                        <button
                            onClick={() => setTab("preview")}
                            className={`flex-1 py-3 text-sm font-sans uppercase tracking-widest text-center transition-colors ${tab === "preview" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Preview
                        </button>
                    </div>

                    <div className="min-h-[400px]">
                        {tab === "write" ? (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Describe this skill..."
                                className="w-full h-[400px] px-6 py-5 bg-transparent text-base font-mono leading-relaxed resize-y focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                        ) : (
                            <div className="px-6 py-5">
                                {content.trim() ? (
                                    <MarkdownRenderer content={content} />
                                ) : (
                                    <p className="text-gray-400 italic">Nothing to preview yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-4 px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-sans">
                        {error}
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="px-8 py-3 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {publishing ? "Saving..." : editSlug ? "Update Skill" : "Publish Skill"}
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function SkillsWritePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
            <SkillsWriteEditor />
        </Suspense>
    );
}
