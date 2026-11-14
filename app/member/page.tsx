"use client";

import { useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Member {
    id: string;
    name: string;
    avatar: string | null;
    introduction: string;
    permission_group: number;
}

export default function MemberPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/members")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMembers(data.members);
                }
            })
            .catch(err => console.error("Error loading members:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-eczar mb-12 tracking-tight text-center">Members</h1>

                {loading ? (
                    <div className="text-center text-gray-400">Loading members...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                        {members.map(member => (
                            <div key={member.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 md:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">

                                {/* Avatar */}
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 border border-gray-200 dark:border-gray-700 shrink-0">
                                    {member.avatar ? (
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-500 uppercase">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <h2 className="max-w-full text-lg md:text-2xl font-bold tracking-wide break-words text-gray-900 dark:text-gray-100 mb-1">
                                    {member.name}
                                </h2>
                                <p className="text-xs font-sans uppercase tracking-widest text-gray-500 mb-1">
                                    Researcher
                                </p>

                                {/* Introduction — only for members who wrote one */}
                                {member.introduction?.trim() && (
                                    <div
                                        className="mt-4 md:mt-6 w-full text-left p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md break-words"
                                        style={{ maxHeight: '140px', overflowY: 'auto' }}
                                    >
                                        <MarkdownRenderer content={member.introduction} small />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!loading && members.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        No members found with permission group 1~4.
                    </div>
                )}
            </div>
        </main>
    );
}
