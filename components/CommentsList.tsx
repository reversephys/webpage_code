"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";

interface CommentExpand {
    user_id?: {
        id?: string;
        name?: string;
        username?: string;
        avatar?: string;
    };
}

interface Comment {
    id: string;
    post_uuid: string;
    user_id: string;
    content: string;
    created: string;
    expand?: CommentExpand;
}

async function getAuthToken(): Promise<string> {
    try {
        const res = await fetch("/api/auth/token");
        if (res.ok) {
            const data = await res.json();
            return data.token || "";
        }
    } catch { /* ignore */ }
    return "";
}

export function CommentsList({ postUuid }: { postUuid: string }) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments/${encodeURIComponent(postUuid)}`);
            if (res.ok) {
                const data = await res.json();
                setComments(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch comments", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postUuid]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        setError("");

        try {
            // Get token from server-side cookie via API
            const token = await getAuthToken();

            if (!token) {
                setError("Not authenticated. Please log in again.");
                setSubmitting(false);
                return;
            }

            const res = await fetch("/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    post_uuid: postUuid,
                    content: newComment
                }),
            });

            if (res.ok) {
                setNewComment("");
                fetchComments();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to post comment.");
            }
        } catch {
            setError("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const getInitial = (comment: Comment) => {
        const name = comment.expand?.user_id?.username || "U";
        return name[0].toUpperCase();
    };

    return (
        <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold font-eczar mb-6">Comments ({comments.length})</h3>

            {loading ? (
                <p className="text-gray-500 italic text-sm">Loading comments...</p>
            ) : (
                <div className="space-y-6 mb-10">
                    {comments.map((comment) => {
                        const avatarFile = comment.expand?.user_id?.avatar;
                        const userId = comment.expand?.user_id?.id || comment.user_id;
                        const avatarUrl = avatarFile
                            ? `/api/user-avatar/${userId}/${avatarFile}`
                            : null;

                        return (
                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/30 p-4 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-500 font-bold text-xs uppercase">
                                                {getInitial(comment)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">
                                            {comment.expand?.user_id?.username || "Unknown User"}
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                            {formatDate(comment.created)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        );
                    })}
                    {comments.length === 0 && (
                        <p className="text-gray-500 italic text-sm">No comments yet. Be the first to share your thoughts!</p>
                    )}
                </div>
            )}

            {user ? (
                <form onSubmit={handleSubmit} className="mt-6">
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                        Leave a comment
                    </label>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your comment here..."
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-sans focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors min-h-[100px] resize-y"
                    />
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="px-6 py-2 bg-foreground text-background font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {submitting ? "Posting..." : "Post Comment"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800/30 p-6 text-center border border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Please log in to leave a comment.
                    </p>
                    <a
                        href="/login"
                        className="px-6 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-bold uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-block"
                    >
                        Log In
                    </a>
                </div>
            )}
        </div>
    );
}
