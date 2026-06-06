"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthContext";

interface SkillActionsProps {
    title: string;
    slug: string;
    authorId?: string;
}

export function SkillActions({ title, slug, authorId }: SkillActionsProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const { user } = useAuth();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this skill?")) return;

        setDeleting(true);
        try {
            const res = await fetch("/api/skills/delete", {
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
            alert("Failed to delete skill.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex gap-3">
            <Link
                href={`/api/skills/download?slug=${encodeURIComponent(slug)}`}
                className="text-xs font-sans uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-4 py-1.5 hover:bg-foreground hover:text-background transition-colors"
            >
                Download
            </Link>
            {user && (user.id === authorId || Number(user.permission_group) === 99) && (
                <>
                    <Link
                        href={`/skills/write?edit=${encodeURIComponent(slug)}`}
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
                </>
            )}
        </div>
    );
}
