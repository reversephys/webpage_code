"use client";

import { useState, useRef, useCallback, useEffect, useDeferredValue, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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

// Clipboard image types the server accepts, and the extension each is saved under.
const PASTE_IMAGE_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
};

const isPublicTag = (tag: string) => tag.toLowerCase() === "public";

function splitTags(value: string): string[] {
    return value.split(",").map((t) => t.trim()).filter(Boolean);
}

function BlogWriteEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editSlug = searchParams.get("edit");
    const { user, loading: authLoading } = useAuth();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<Tab>("write");
    // Wide screens: preview pane beside the editor. Narrow screens use the tabs instead.
    const [showPreview, setShowPreview] = useState(true);
    const [title, setTitle] = useState("");
    const [tag, setTag] = useState("");
    // Stored as the `public` tag; chosen with buttons instead of typed.
    const [isPublic, setIsPublic] = useState(false);
    const [content, setContent] = useState("");
    // The preview may lag a keystroke behind so typing stays smooth on long posts.
    const deferredContent = useDeferredValue(content);
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
                const res = await fetch(`/api/blog/post/${encodeURIComponent(editSlug)}`);
                if (!res.ok) {
                    setError("Failed to load post data.");
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setTitle(data.title || "");
                const loadedTags = splitTags(data.tag || "");
                setIsPublic(loadedTags.some(isPublicTag));
                setTag(loadedTags.filter((t) => !isPublicTag(t)).join(", "));
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

    const addImages = (files: File[]) => {
        setImages((prev) => [...prev, ...files]);
        setImagePreviews((prev) => [
            ...prev,
            ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
        ]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        addImages(files);
    };

    // Pasting an image (a screenshot, or "Copy image") attaches it and puts its
    // reference at the cursor, instead of attach -> hover -> Insert.
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = Array.from(e.clipboardData.files).filter((file) => PASTE_IMAGE_EXT[file.type]);
        // Text copied from an office app can carry a picture of itself; keep the text then.
        if (pasted.length === 0 || e.clipboardData.getData("text/plain")) return;

        e.preventDefault();
        // Clipboard images all arrive as "image.png"; the server maps references by name.
        const stamp = Date.now().toString(36);
        const files = pasted.map((file, i) =>
            new File([file], `pasted-${stamp}-${i + 1}.${PASTE_IMAGE_EXT[file.type]}`, { type: file.type })
        );
        addImages(files);

        const refs = files.map((file) => `![image](images/${file.name})`).join("\n");
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        setContent(content.slice(0, start) + refs + content.slice(end));
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + refs.length, start + refs.length);
        }, 0);
    };

    // With both panes showing, keep the preview near the part being written.
    const syncPreviewScroll = () => {
        const textarea = textareaRef.current;
        const preview = previewRef.current;
        if (!textarea || !preview) return;
        const range = textarea.scrollHeight - textarea.clientHeight;
        if (range <= 0) return;
        preview.scrollTop = (textarea.scrollTop / range) * (preview.scrollHeight - preview.clientHeight);
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
        // Visibility comes from the buttons; a `public` typed into the tag field
        // out of habit still counts.
        const typedTags = splitTags(tag);
        const tags = typedTags.filter((t) => !isPublicTag(t));
        if (isPublic || typedTags.some(isPublicTag)) tags.unshift("public");

        if (!title.trim()) { setError("Title is required."); return; }
        if (tags.length === 0) { setError("Tag is required."); return; }
        if (!content.trim()) { setError("Content is required."); return; }

        setPublishing(true);
        setError(null);

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("tag", tags.join(", "));
        formData.append("content", content);

        if (editSlug) {
            // Edit mode
            formData.append("slug", editSlug);
            formData.append("deletedImages", JSON.stringify(deletedImages));
            images.forEach((img) => formData.append("newImages", img));

            try {
                const res = await fetch("/api/blog/edit", {
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
                const res = await fetch("/api/blog/publish", {
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
    const previewContent = deferredContent.replace(
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
            {/* With the preview pane open, wide screens get more room for the two panes. */}
            <div className={`max-w-4xl ${showPreview ? "lg:max-w-7xl" : ""} mx-auto`}>
                {/* Back link */}
                <Link
                    href="/blog"
                    className="inline-flex items-center text-sm font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Posts
                </Link>

                {!editSlug && (
                    <h1 className="text-5xl md:text-7xl font-eczar tracking-tight mb-12">
                        New Post
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
                        disabled={!!editSlug}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-lg font-serif focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Tag input + visibility */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end gap-6">
                    <div className="flex-1">
                        <label className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-1">Tag</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-sans break-keep">
                            게시글을 분류하는 태그입니다. <span className="font-semibold text-gray-700 dark:text-gray-300">pinned</span>를 입력하면 게시판 상단에 고정됩니다.
                        </p>
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="e.g. reversing, firmware, hardware..."
                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-base font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <span className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-1">Visibility</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-sans break-keep">
                            {isPublic ? "누구나 볼 수 있습니다." : "멤버만 볼 수 있습니다."}
                        </p>
                        <div role="group" aria-label="Visibility" className="inline-flex border border-gray-200 dark:border-gray-700">
                            {[
                                { value: true, label: "Public" },
                                { value: false, label: "Private" },
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    aria-pressed={isPublic === option.value}
                                    onClick={() => setIsPublic(option.value)}
                                    className={`px-6 py-3 text-sm leading-6 font-sans uppercase tracking-widest transition-colors ${isPublic === option.value
                                        ? "bg-foreground text-background"
                                        : "bg-white dark:bg-gray-900 text-gray-400 hover:text-foreground"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
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
                        <button
                            type="button"
                            aria-pressed={showPreview}
                            onClick={() => setShowPreview(!showPreview)}
                            title={showPreview ? "Hide preview" : "Show preview"}
                            className={`hidden lg:inline-flex items-center gap-1.5 ml-auto px-2.5 py-1.5 text-xs font-sans uppercase tracking-widest rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${showPreview ? "text-foreground" : "text-gray-400"}`}
                        >
                            {showPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            Preview
                        </button>
                    </div>

                    {/* WRITE / PREVIEW tabs — narrow screens only; wide screens show both panes */}
                    <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-700">
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

                    <div className={`hidden ${showPreview ? "lg:grid" : ""} grid-cols-2 border-b border-gray-200 dark:border-gray-700 text-sm font-sans uppercase tracking-widest text-gray-400 text-center`}>
                        <span className="py-3">Write</span>
                        <span className="py-3 border-l border-gray-200 dark:border-gray-700">Preview</span>
                    </div>

                    {/* Editor / Preview area */}
                    <div className={`min-h-[400px] ${showPreview ? "lg:grid lg:grid-cols-2" : ""}`}>
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onPaste={handlePaste}
                            onScroll={syncPreviewScroll}
                            placeholder="Write your post in Markdown..."
                            className={`${tab === "write" ? "block" : "hidden"} lg:block w-full h-[400px] ${showPreview ? "lg:h-[640px] lg:resize-none" : ""} px-6 py-5 bg-transparent text-base font-mono leading-relaxed resize-y focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600`}
                        />
                        <div
                            ref={previewRef}
                            className={`${tab === "preview" ? "block" : "hidden"} ${showPreview ? "lg:block" : "lg:hidden"} px-6 py-5 lg:h-[640px] lg:overflow-y-auto lg:border-l border-gray-200 dark:border-gray-700`}
                        >
                            {previewContent.trim() ? (
                                <MarkdownRenderer content={previewContent} allowBlobUrls />
                            ) : (
                                <p className="text-gray-400 italic">Nothing to preview yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="mt-8 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-1">Attach Images</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-sans break-keep">
                        본문에 이미지를 붙여넣으면(Ctrl+V) 자동으로 첨부되고 커서 위치에 들어갑니다.
                    </p>
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

export default function BlogWritePage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-500 text-center py-20 text-lg">Loading...</p>
                </div>
            </main>
        }>
            <BlogWriteEditor />
        </Suspense>
    );
}
