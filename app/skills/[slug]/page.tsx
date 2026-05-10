import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllSkills, getSkillBySlug } from "@/lib/skills";
import { getUserMap } from "@/lib/users";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SkillActions } from "@/components/SkillActions";
import AuthGuard from "@/components/AuthGuard";
import { CommentsList } from "@/components/CommentsList";

interface SkillPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const skills = getAllSkills();
    return skills.map((skill) => ({
        slug: skill.slug,
    }));
}

export default async function SkillPage({ params }: SkillPageProps) {
    const { slug } = await params;
    const skill = getSkillBySlug(slug);
    const userMap = await getUserMap();
    const authorName = skill?.userId ? (userMap.get(skill.userId) || "Unknown") : "Unknown";

    if (!skill) {
        notFound();
    }

    return (
        <AuthGuard>
            <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
                <article className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-12">
                        <Link
                            href="/skills"
                            className="inline-flex items-center text-sm font-sans uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Skills
                        </Link>

                        <SkillActions title={skill.title} slug={skill.slug || ""} authorId={skill.userId} />
                    </div>

                    {/* Header */}
                    <header className="mb-12 text-center">
                        <div className="flex justify-center items-center gap-4 mb-6 text-xs tracking-[0.2em] text-gray-400 uppercase font-sans">
                            <span>BY {authorName}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-8">
                            {skill.title}
                        </h1>
                    </header>

                    {/* Markdown content */}
                    <MarkdownRenderer content={skill.content} />

                    {/* Comments section */}
                    {skill.slug && <CommentsList postUuid={skill.slug} />}
                </article>
            </main>
        </AuthGuard>
    );
}
