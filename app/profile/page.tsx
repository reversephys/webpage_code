"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { pb } from "@/lib/pocketbase";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Pencil, X, Save, Key } from "lucide-react";

type Tab = "write" | "preview";

interface ProfileData {
    id: string;
    collectionId?: string;
    username: string;
    email: string;
    name: string;
    avatar?: string;
    introduction: string;
    created: string;
    updated: string;
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

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    // Profile data from server (fetched once)
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Password change state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    // Name edit state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState("");

    // Intro edit state
    const [isEditingIntro, setIsEditingIntro] = useState(false);
    const [tab, setTab] = useState<Tab>("write");
    const [editIntro, setEditIntro] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Avatar edit state
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Fetch the full profile from server API once
    useEffect(() => {
        if (user && !profile) {
            fetch("/api/profile", {
                headers: { Authorization: `Bearer ${pb.authStore.token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.id) {
                        setProfile(data);
                    }
                })
                .catch((err) => console.error("Failed to fetch profile:", err))
                .finally(() => setProfileLoading(false));
        }
    }, [user, profile]);

    const insertToolbar = useCallback(
        (action: (typeof TOOLBAR_ACTIONS)[0]) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = editIntro.slice(start, end) || action.placeholder;

            let insertion = `${action.prefix}${selected}${action.suffix}`;
            if (action.newline && start > 0 && editIntro[start - 1] !== "\n") {
                insertion = "\n" + insertion;
            }

            const newContent = editIntro.slice(0, start) + insertion + editIntro.slice(end);
            setEditIntro(newContent);

            setTimeout(() => {
                textarea.focus();
                const offset = action.newline && start > 0 && editIntro[start - 1] !== "\n" ? 1 : 0;
                const cursorPos = start + action.prefix.length + offset;
                textarea.setSelectionRange(cursorPos, cursorPos + selected.length);
            }, 0);
        },
        [editIntro]
    );

    const handleSaveName = async () => {
        setSaving(true);
        setSaveMessage(null);

        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({ name: editName }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                pb.authStore.save(data.token, data.record);
                setProfile((prev) => (prev ? { ...prev, name: editName } : prev));
                setIsEditingName(false);
                setSaveMessage("Name updated successfully!");
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage(data.error || "Failed to save name.");
            }
        } catch {
            setSaveMessage("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAvatar = async () => {
        if (!avatarFile) {
            setSaveMessage("Please select an image file first.");
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setSaving(true);
        setSaveMessage(null);

        try {
            const formData = new FormData();
            formData.append("avatar", avatarFile);

            const res = await fetch("/api/profile/avatar", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${pb.authStore.token}`,
                },
                body: formData,
            });
            const data = await res.json();

            if (res.ok && data.success) {
                pb.authStore.save(data.token, data.record);
                setProfile((prev) => (prev ? { ...prev, avatar: data.record.avatar, collectionId: data.record.collectionId } : prev));
                setIsEditingAvatar(false);
                setAvatarFile(null);
                setSaveMessage("Avatar updated successfully!");
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage(data.error || "Failed to save avatar.");
            }
        } catch {
            setSaveMessage("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveIntro = async () => {
        setSaving(true);
        setSaveMessage(null);

        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({ introduction: editIntro }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                pb.authStore.save(data.token, data.record);
                setProfile((prev) => (prev ? { ...prev, introduction: editIntro } : prev));
                setIsEditingIntro(false);
                setTab("write");
                setSaveMessage("Introduction updated successfully!");
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage(data.error || "Failed to save introduction.");
            }
        } catch {
            setSaveMessage("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSave = async () => {
        setSavingPassword(true);
        setPasswordMessage(null);

        if (newPassword !== passwordConfirm) {
            setPasswordMessage("New password and confirm password do not match.");
            setSavingPassword(false);
            return;
        }

        try {
            const res = await fetch("/api/profile/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({ oldPassword, newPassword, passwordConfirm }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                pb.authStore.save(data.token, data.record);
                setPasswordMessage("Password changed successfully.");
                setOldPassword("");
                setNewPassword("");
                setPasswordConfirm("");
                setTimeout(() => {
                    setPasswordMessage(null);
                    setIsChangingPassword(false);
                }, 2000);
            } else {
                setPasswordMessage(data.error || "Failed to change password.");
            }
        } catch {
            setPasswordMessage("Network error. Please try again.");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleCancelPassword = () => {
        setOldPassword("");
        setNewPassword("");
        setPasswordConfirm("");
        setPasswordMessage(null);
        setIsChangingPassword(false);
    };

    if (loading || profileLoading) {
        return (
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <div className="max-w-2xl mx-auto text-center text-gray-400">Loading profile...</div>
            </main>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-eczar mb-12 tracking-tight text-center">Profile</h1>

                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-8 space-y-8">

                    {/* 1. User Name & Change Password */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800 flex flex-col space-y-4">
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-sans uppercase tracking-widest text-gray-500">Username</span>
                                {!isChangingPassword && (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="whitespace-nowrap inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <Key className="w-3 h-3" /> Change Password
                                    </button>
                                )}
                            </div>
                            <div className="text-lg sm:text-xl font-bold tracking-wider truncate">
                                {profile?.username || user.username}
                            </div>
                        </div>

                        {/* Password Form */}
                        {isChangingPassword && (
                            <div className="space-y-4 p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
                                <h2 className="text-xl font-eczar mb-4">Change Password</h2>

                                <div>
                                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-sans uppercase tracking-widest text-gray-500 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                                    />
                                </div>

                                {passwordMessage && (
                                    <p className={`text-sm ${passwordMessage.includes("success") ? "text-green-500" : "text-red-500"}`}>
                                        {passwordMessage}
                                    </p>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        onClick={handleCancelPassword}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-sans uppercase tracking-widest text-gray-500 hover:text-foreground border border-gray-200 dark:border-gray-700 rounded transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePasswordSave}
                                        disabled={savingPassword}
                                        className="inline-flex items-center gap-1.5 px-6 py-2 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {savingPassword ? "Changing..." : "Save Password"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800 flex flex-col space-y-4">
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-sans uppercase tracking-widest text-gray-500">Name</span>
                                {!isEditingName && (
                                    <button
                                        onClick={() => {
                                            setIsEditingName(true);
                                            setEditName(profile?.name || "");
                                        }}
                                        className="whitespace-nowrap inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" /> Edit Name
                                    </button>
                                )}
                            </div>
                            {!isEditingName && (
                                <div className="text-lg sm:text-xl font-bold tracking-wider truncate">
                                    {profile?.name || <span className="text-gray-400 italic font-normal text-base">No name set</span>}
                                </div>
                            )}
                        </div>

                        {/* Name Edit Form */}
                        {isEditingName && (
                            <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-foreground transition-colors text-base"
                                />
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditingName(false)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-sans uppercase tracking-widest text-gray-500 hover:text-foreground border border-gray-200 dark:border-gray-700 rounded transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveName}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 px-6 py-2 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {saving ? "Saving..." : "Save Name"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avatar */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800 flex flex-col space-y-4">
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-sans uppercase tracking-widest text-gray-500">Avatar</span>
                                {!isEditingAvatar && (
                                    <button
                                        onClick={() => setIsEditingAvatar(true)}
                                        className="whitespace-nowrap inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" /> Edit Avatar
                                    </button>
                                )}
                            </div>
                            {!isEditingAvatar ? (
                                <div className="mt-2 text-lg sm:text-xl font-bold tracking-wider truncate">
                                    {profile?.avatar ? (
                                        <img src={`/api/files/${profile.collectionId}/${profile.id}/${profile.avatar}`} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center border border-gray-300 dark:border-gray-700 shrink-0">
                                            <span className="text-gray-400 text-sm font-normal">No img</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-gray-300 dark:hover:file:bg-gray-700"
                                    />
                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setIsEditingAvatar(false);
                                                setAvatarFile(null);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-sans uppercase tracking-widest text-gray-500 hover:text-foreground border border-gray-200 dark:border-gray-700 rounded transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveAvatar}
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 px-6 py-2 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                                        >
                                            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Avatar"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5 & 6. Introduction */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800 flex flex-col space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-sans uppercase tracking-widest text-gray-500">Introduction</span>
                            {!isEditingIntro && (
                                <button
                                    onClick={() => {
                                        setIsEditingIntro(true);
                                        setEditIntro(profile?.introduction || "");
                                    }}
                                    className="whitespace-nowrap inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-sans uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    <Pencil className="w-3 h-3" /> Edit Introduction
                                </button>
                            )}
                        </div>

                        {!isEditingIntro ? (
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 min-h-[100px]">
                                {profile?.introduction?.trim() ? (
                                    <MarkdownRenderer content={profile.introduction} />
                                ) : (
                                    <p className="text-gray-400 italic text-sm">No introduction yet.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
                                <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50">
                                        {TOOLBAR_ACTIONS.map((action) => (
                                            <button
                                                key={action.title}
                                                title={action.title}
                                                onClick={() => {
                                                    setTab("write");
                                                    insertToolbar(action);
                                                }}
                                                className="px-2.5 py-1.5 text-xs font-mono text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Write / Preview tabs */}
                                    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <button
                                            onClick={() => setTab("write")}
                                            className={`flex-1 py-3 text-sm font-sans uppercase tracking-widest text-center transition-colors ${tab === "write"
                                                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                }`}
                                        >
                                            Write
                                        </button>
                                        <button
                                            onClick={() => setTab("preview")}
                                            className={`flex-1 py-3 text-sm font-sans uppercase tracking-widest text-center transition-colors ${tab === "preview"
                                                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                }`}
                                        >
                                            Preview
                                        </button>
                                    </div>

                                    {/* Editor / Preview */}
                                    <div className="min-h-[400px] bg-white dark:bg-gray-900">
                                        {tab === "write" ? (
                                            <textarea
                                                ref={textareaRef}
                                                value={editIntro}
                                                onChange={(e) => setEditIntro(e.target.value)}
                                                placeholder="Write your introduction in Markdown..."
                                                className="w-full px-6 py-5 bg-transparent text-base font-mono leading-relaxed resize-y focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                style={{ minHeight: '400px' }}
                                            />
                                        ) : (
                                            <div className="px-6 py-5">
                                                {editIntro.trim() ? (
                                                    <MarkdownRenderer content={editIntro} />
                                                ) : (
                                                    <p className="text-gray-400 italic font-sans text-sm">Nothing to preview yet.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditingIntro(false)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-sans uppercase tracking-widest text-gray-500 hover:text-foreground border border-gray-200 dark:border-gray-700 rounded transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveIntro}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 px-6 py-2 bg-foreground text-background font-sans uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {saving ? "Saving..." : "Save Intro"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Global Save Message */}
                    {saveMessage && (
                        <div
                            className={`px-4 py-3 text-sm font-sans text-center rounded ${saveMessage.includes("success")
                                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                                }`}
                        >
                            {saveMessage}
                        </div>
                    )}

                    {/* Sign Out */}
                    <button
                        onClick={() => {
                            logout();
                            router.push("/");
                        }}
                        className="w-full mt-4 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-sans uppercase tracking-widest text-sm transition-colors rounded"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </main>
    );
}
