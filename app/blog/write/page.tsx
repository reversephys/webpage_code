"use client";

import { useState, useRef, useCallback, useEffect, useDeferredValue, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, ImagePlus } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthContext";
import { buildTags, isSupportedImage, isThumbnailFile, nameImages, parseTags, referencedImages } from "@/lib/post-editor";

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

const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";

function BlogWriteEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editSlug = searchParams.get("edit");
    const { user, loading: authLoading } = useAuth();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
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
    // Images added while writing (pasted or picked); uploaded on save.
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<{ name: string; url: string }[]>([]);
    // Images the post already has on the server (edit mode).
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    // Which of those the body used when it was loaded. One dropped from the body
    // since then is deleted on save; one that was never in it is left alone.
    const [loadedRefs, setLoadedRefs] = useState<Set<string>>(new Set());
    // List thumbnail: the one on the server (`picked` when the author chose it,
    // otherwise it is a body image used automatically), and a newly picked one.
    const [savedThumbnail, setSavedThumbnail] = useState<{ url: string | null; picked: boolean }>({ url: null, picked: false });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [removeThumbnail, setRemoveThumbnail] = useState(false);
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
                const loadedTags = parseTags(data.tag || "");
                const loadedImages: ExistingImage[] = data.images || [];
                setTitle(data.title || "");
                setIsPublic(loadedTags.isPublic);
                setTag(loadedTags.tags.join(", "));
                setContent(data.content || "");
                setExistingImages(loadedImages.filter((img) => !isThumbnailFile(img.name)));
                setLoadedRefs(referencedImages(data.content || ""));
                setSavedThumbnail({
                    url: data.thumbnail || null,
                    picked: loadedImages.some((img) => isThumbnailFile(img.name)),
                });
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

    // Add images to the post and put their references at the cursor. Used for
    // pasted images and for ones picked with the toolbar button.
    const insertImages = (files: File[]) => {
        const named = nameImages(files);
        setError(named.length < files.length ? "Only PNG, JPG, GIF and WebP images can be added." : null);
        if (named.length === 0) return;

        setImages((prev) => [...prev, ...named]);
        setImagePreviews((prev) => [
            ...prev,
            ...named.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
        ]);

        const refs = named.map((file) => `![image](images/${file.name})`).join("\n");
        const textarea = textareaRef.current;
        const start = textarea ? textarea.selectionStart : content.length;
        const end = textarea ? textarea.selectionEnd : content.length;
        setContent(content.slice(0, start) + refs + content.slice(end));
        setTab("write");
        setTimeout(() => {
            if (!textarea) return;
            textarea.focus();
            textarea.setSelectionRange(start + refs.length, start + refs.length);
        }, 0);
    };

    // Pasting an image (a screenshot, or "Copy image") drops it into the post.
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = Array.from(e.clipboardData.files).filter(isSupportedImage);
        // Text copied from an office app can carry a picture of itself; keep the text then.
        if (pasted.length === 0 || e.clipboardData.getData("text/plain")) return;

        e.preventDefault();
        insertImages(pasted);
    };

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (files.length > 0) insertImages(files);
    };

    const handleThumbnailPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!isSupportedImage(file)) {
            setError("Only PNG, JPG, GIF and WebP images can be used as a thumbnail.");
            return;
        }
        setError(null);
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
        setRemoveThumbnail(false);
    };

    // Drop a newly picked thumbnail, or mark the one saved with the post for removal.
    const handleThumbnailRemove = () => {
        if (thumbnailFile) {
            if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
            setThumbnailFile(null);
            setThumbnailPreview(null);
        } else {
            setRemoveThumbnail(true);
        }
    };

    const shownThumbnail = thumbnailFile ? thumbnailPreview : removeThumbnail ? null : savedThumbnail.url;
    const canRemoveThumbnail = !!thumbnailFile || (savedThumbnail.picked && !removeThumbnail);
    const thumbnailStatus = thumbnailFile
        ? `새로 지정한 이미지입니다: ${thumbnailFile.name}`
        : removeThumbnail
            ? "저장하면 지정한 썸네일이 삭제됩니다."
            : savedThumbnail.picked
                ? "직접 지정한 썸네일입니다."
                : savedThumbnail.url
                    ? "지정한 썸네일이 없어 본문 이미지가 쓰이고 있습니다."
                    : "지정한 썸네일이 없습니다.";

    // With both panes showing, keep the preview near the part being written.
    const syncPreviewScroll = () => {
        const textarea = textareaRef.current;
        const preview = previewRef.current;
        if (!textarea || !preview) return;
        const range = textarea.scrollHeight - textarea.clientHeight;
        if (range <= 0) return;
        preview.scrollTop = (textarea.scrollTop / range) * (preview.scrollHeight - preview.clientHeight);
    };

    const handlePublish = async () => {
        const tags = buildTags(tag, isPublic);

        if (!title.trim()) { setError("Title is required."); return; }
        if (tags.length === 0) { setError("Tag is required."); return; }
        if (!content.trim()) { setError("Content is required."); return; }

        setPublishing(true);
        setError(null);

        // Only images the body still points at are uploaded.
        const used = referencedImages(content);
        const newImages = images.filter((img) => used.has(img.name));

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("tag", tags.join(", "));
        formData.append("content", content);
        if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

        if (editSlug) {
            // Edit mode
            const deletedImages = existingImages
                .filter((img) => loadedRefs.has(img.name) && !used.has(img.name))
                .map((img) => img.name);
            formData.append("slug", editSlug);
            formData.append("deletedImages", JSON.stringify(deletedImages));
            if (removeThumbnail) formData.append("removeThumbnail", "true");
            newImages.forEach((img) => formData.append("newImages", img));

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
            newImages.forEach((img) => formData.append("images", img));

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
            {/* Wide screens leave room for the editor and its preview side by side. The width
                is the same with the preview closed, so toggling it does not move the page. */}
            <div className="max-w-4xl lg:max-w-7xl mx-auto">
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
                            title="Insert image"
                            aria-label="Insert image"
                            onClick={() => imageInputRef.current?.click()}
                            className="px-2.5 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <ImagePlus className="w-4 h-4" />
                        </button>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept={IMAGE_ACCEPT}
                            multiple
                            onChange={handleImagePick}
                            className="hidden"
                        />
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

                    {/* Pane labels on wide screens. The row stays when the preview is closed,
                        so the editor block keeps its height. */}
                    <div className={`hidden lg:grid ${showPreview ? "grid-cols-2" : "grid-cols-1"} border-b border-gray-200 dark:border-gray-700 text-sm font-sans uppercase tracking-widest text-gray-400 text-center`}>
                        <span className="py-3">Write</span>
                        {showPreview && <span className="py-3 border-l border-gray-200 dark:border-gray-700">Preview</span>}
                    </div>

                    {/* Editor / Preview area. Both panes have one fixed height, so the block is
                        the same size whichever of them is showing. */}
                    <div className={`lg:grid ${showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onPaste={handlePaste}
                            onScroll={syncPreviewScroll}
                            placeholder="Write your post in Markdown..."
                            className={`${tab === "write" ? "block" : "hidden"} lg:block w-full h-[400px] lg:h-[640px] px-6 py-5 bg-transparent text-base font-mono leading-relaxed resize-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600`}
                        />
                        <div
                            ref={previewRef}
                            className={`${tab === "preview" ? "block" : "hidden"} ${showPreview ? "lg:block" : "lg:hidden"} h-[400px] lg:h-[640px] overflow-y-auto px-6 py-5 lg:border-l border-gray-200 dark:border-gray-700`}
                        >
                            {previewContent.trim() ? (
                                <MarkdownRenderer content={previewContent} allowBlobUrls />
                            ) : (
                                <p className="text-gray-400 italic">Nothing to preview yet.</p>
                            )}
                        </div>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-sans break-keep">
                    이미지는 본문에 붙여넣거나(Ctrl+V) 툴바의 이미지 버튼으로 넣습니다.
                </p>

                {/* Thumbnail */}
                <div className="mt-8 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <span className="block text-xs font-sans uppercase tracking-widest text-gray-400 mb-1">Thumbnail</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-sans break-keep">
                        글 목록에 표시되는 대표 이미지입니다. 지정하지 않으면 본문 이미지 중 하나가 자동으로 쓰입니다.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        {/* The post list crops thumbnails to this 200x150 box on wide screens. */}
                        <div className="w-[200px] h-[150px] shrink-0 rounded-sm overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {shownThumbnail ? (
                                <img src={shownThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-sans uppercase tracking-widest text-gray-400">None</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-sans text-gray-600 dark:text-gray-400 mb-3 break-all">{thumbnailStatus}</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="text-sm font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Choose Image
                                </button>
                                {canRemoveThumbnail && (
                                    <button
                                        type="button"
                                        onClick={handleThumbnailRemove}
                                        className="text-sm font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept={IMAGE_ACCEPT}
                                onChange={handleThumbnailPick}
                                className="hidden"
                            />
                        </div>
                    </div>
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
