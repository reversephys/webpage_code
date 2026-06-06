"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthContext";

interface PostActionsProps {
    slug: string;
    authorId?: string;
}

export function PostActions({ slug, authorId }: PostActionsProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const { user } = useAuth();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        setDeleting(true);
        try {
            const res = await fetch("/api/blog/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({ slug }),
            });

            const data = await res.json();
            if (data.redirect) {
                router.push(data.redirect);
            }
        } catch {
            alert("Failed to delete post.");
        } finally {
            setDeleting(false);
        }
    };

    if (!user || (user.id !== authorId && Number(user.permission_group) !== 99)) return null;

    return (
        <div className="flex gap-3">
            <Link
                href={`/blog/write?edit=${encodeURIComponent(slug)}`}
                className="text-xs font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-4 py-1.5 hover:bg-foreground hover:text-background transition-colors"
            >
                Edit
            </Link>
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-4 py-1.5 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50"
            >
                {deleting ? "Deleting..." : "Delete"}
            </button>
        </div>
    );
}
