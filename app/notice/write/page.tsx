"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthContext";

type Tab = "write" | "preview";

interface ExistingImage {
    name: string;
    url: string;
}

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

function NoticeWriteEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editSlug = searchParams.get("edit");
    const { user, loading: authLoading } = useAuth();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<Tab>("write");
    const [title, setTitle] = useState("");
    const [tag, setTag] = useState("");
    const [content, setContent] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<{ name: string; url: string }[]>([]);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [deletedImages, setDeletedImages] = useState<string[]>([]);
    const [publishing, setPublishing] = useState(false);
    const [loading, setLoading] = useState(!!editSlug);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Load existing post data in edit mode
    useEffect(() => {
        if (!user || !editSlug) return;

        (async () => {
            try {
                const res = await fetch(`/api/notice/post/${encodeURIComponent(editSlug)}`);
                if (!res.ok) {
                    setError("Failed to load post data.");
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setTitle(data.title || "");
                setTag(data.tag || "");
                setContent(data.content || "");
                setExistingImages(data.images || []);
            } catch {
                setError("Failed to load post data.");
            } finally {
                setLoading(false);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages = [...images, ...files];
        setImages(newImages);

        const newPreviews = files.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file), // Important: cleanup later?
        }));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const removeNewImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        URL.revokeObjectURL(imagePreviews[index].url);
        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    const removeExistingImage = (index: number) => {
        const img = existingImages[index];
        setDeletedImages([...deletedImages, img.name]);
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    const insertImageRef = (imageName: string) => {
        const textarea = textareaRef.current;
        const ref = `![${imageName}](images/${imageName})`;
        if (textarea) {
            const pos = textarea.selectionStart;
            const newContent = content.slice(0, pos) + ref + content.slice(pos);
            setContent(newContent);
            setTimeout(() => {
                textarea.focus();
                const cursorPos = pos + ref.length;
                textarea.setSelectionRange(cursorPos, cursorPos);
            }, 0);
        } else {
            setContent(content + "\n" + ref);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) { setError("Title is required."); return; }
        if (!tag.trim()) { setError("Tag is required."); return; }
        if (!content.trim()) { setError("Content is required."); return; }

        setPublishing(true);
        setError(null);

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("tag", tag.trim());
        formData.append("content", content);

        if (editSlug) {
            // Edit mode
            formData.append("slug", editSlug);
            formData.append("deletedImages", JSON.stringify(deletedImages));
            images.forEach((img) => formData.append("newImages", img));

            try {
                const res = await fetch("/api/notice/edit", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${pb.authStore.token}`,
                    },
                    body: formData,
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
        } else {
            // New post mode
            images.forEach((img) => formData.append("images", img));

            try {
                const res = await fetch("/api/notice/publish", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${pb.authStore.token}`,
                    },
                    body: formData,
                });
                const data = await res.json();
                if (data.redirect) {
                    router.push(data.redirect);
                    return;
                }
                if (!res.ok) setError(data.error || "Failed to publish.");
            } catch {
                setError("Network error. Please try again.");
            } finally {
                setPublishing(false);
            }
        }
    };

    // Build preview content
    const previewContent = content.replace(
        /!\[([^\]]*)\]\(images\/([^)]+)\)/g,
        (match, alt, filename) => {
            // Check new image previews first
            const newPreview = imagePreviews.find((p) => p.name === filename);
            if (newPreview) return `![${alt}](${newPreview.url})`;
            // Check existing images
            const existing = existingImages.find((p) => p.name === filename);
            if (existing) return `![${alt}](${existing.url})`;
            return match;
        }
    );

    if (loading) {
        return (
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-500 text-center py-20 text-lg">Loading post...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                {/* Back link */}
                <Link
                    href="/notice"
                    className="inline-flex items-center text-sm font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Notice
                </Link>

                {!editSlug && (
                    <h1 className="text-5xl md:text-7xl font-eczar tracking-tight mb-12">
                        New Notice Post
                    </h1>
                )}

                {/* Title input */}
                <div className="mb-6">
                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter post title..."
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-lg font-serif focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                </div>

                {/* Tag input */}
                <div className="mb-8">
                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-1">Tag</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-sans break-keep">
                        게시글을 분류하는 태그입니다. <span className="font-semibold text-gray-700 dark:text-gray-300">public</span>을 입력하면 전체공개 글로 설정되며, <span className="font-semibold text-gray-700 dark:text-gray-300">pinned</span>를 입력하면 게시판 상단에 고정됩니다.
                    </p>
                    <input
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="e.g. Announcement, Equipment, Schedule..."
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-base font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Markdown Editor */}
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    {/* Toolbar */}
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

                    {/* WRITE / PREVIEW tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setTab("write")}
                            className={`flex-1 py-3 text-sm font-sans uppercase tracking-widest text-center transition-colors ${tab === "write"
                                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                        >
                            Write
                        </button>
                        <button
                            onClick={() => setTab("preview")}
                            className={`flex-1 py-3 text-sm font-sans uppercase tracking-widest text-center transition-colors ${tab === "preview"
                                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                        >
                            Preview
                        </button>
                    </div>

                    {/* Editor / Preview area */}
                    <div className="min-h-[400px]">
                        {tab === "write" ? (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your post in Markdown..."
                                className="w-full h-[400px] px-6 py-5 bg-transparent text-base font-mono leading-relaxed resize-y focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                        ) : (
                            <div className="px-6 py-5">
                                {previewContent.trim() ? (
                                    <MarkdownRenderer content={previewContent} />
                                ) : (
                                    <p className="text-gray-400 italic">Nothing to preview yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Upload */}
                <div className="mt-8 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-4">Attach Images</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="block w-full text-sm font-sans text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:font-sans file:uppercase file:tracking-widest file:bg-transparent file:text-gray-600 dark:file:text-gray-400 hover:file:bg-gray-100 dark:hover:file:bg-gray-800 file:cursor-pointer file:transition-colors"
                    />

                    {/* Existing images (edit mode) */}
                    {existingImages.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-sans uppercase tracking-widest text-gray-400 mb-2">Existing Images</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {existingImages.map((img, index) => (
                                    <div key={`existing-${index}`} className="relative group border border-gray-100 dark:border-gray-700">
                                        <img
                                            src={img.url}
                                            alt={img.name}
                                            className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => insertImageRef(img.name)}
                                                title="Insert reference"
                                                className="p-1.5 bg-white text-black text-xs font-sans rounded"
                                            >
                                                Insert
                                            </button>
                                            <button
                                                onClick={() => removeExistingImage(index)}
                                                title="Remove"
                                                className="p-1.5 bg-red-500 text-white text-xs font-sans rounded"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 truncate px-1 py-0.5 font-mono">{img.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New images */}
                    {imagePreviews.length > 0 && (
                        <div className="mt-4">
                            {existingImages.length > 0 && (
                                <p className="text-xs font-sans uppercase tracking-widest text-gray-400 mb-2">New Images</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative group border border-gray-100 dark:border-gray-700">
                                        <img
                                            src={preview.url}
                                            alt={preview.name}
                                            className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => insertImageRef(preview.name)}
                                                title="Insert reference"
                                                className="p-1.5 bg-white text-black text-xs font-sans rounded"
                                            >
                                                Insert
                                            </button>
                                            <button
                                                onClick={() => removeNewImage(index)}
                                                title="Remove"
                                                className="p-1.5 bg-red-500 text-white text-xs font-sans rounded"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 truncate px-1 py-0.5 font-mono">{preview.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div className="mt-4 px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-sans">
                        {error}
                    </div>
                )}

                {/* Publish / Save button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="px-8 py-3 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {publishing ? "Saving..." : editSlug ? "Save Changes" : "Publish"}
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function NoticeWritePage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-500 text-center py-20 text-lg">Loading...</p>
                </div>
            </main>
        }>
            <NoticeWriteEditor />
        </Suspense>
    );
}
