import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getProjectsContent } from "@/lib/projects";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const content = getProjectsContent();

    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-8xl font-eczar mb-12 tracking-tight text-center">PROJECTS</h1>

                {content ? (
                    <MarkdownRenderer content={content} />
                ) : (
                    <div className="text-lg md:text-xl leading-loose text-gray-700 dark:text-gray-300 space-y-8 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3">
                        <p>
                            We are a collective of researchers, engineers, and hackers dedicated to the art of hardware reverse engineering.
                            In an increasingly connected world, the physical layer remains the final frontier of security.
                        </p>
                        <p>
                            Our mission is to dissect, analyze, and understand the secure enclaves that protect the world's most critical data.
                            From side-channel analysis to fault injection, we employ cutting-edge techniques to uncover vulnerabilities that software boundaries cannot hide.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
