import Image from "next/image";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getAboutContent } from "@/lib/about";

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    const content = getAboutContent();

    return (
        <main className="min-h-screen font-sans bg-background text-foreground">
            {/* Hero Section */}
            <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 w-full h-full">
                    <Image
                        src="/hero.png"
                        alt="Physical Lab Hardware Hacking"
                        fill
                        className="object-cover brightness-50 contrast-125"
                        priority
                    />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 text-center text-white px-4">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-eczar uppercase tracking-tighter mb-6 drop-shadow-2xl">
                        PHYSICAL LAB
                    </h1>
                    <p className="text-xl md:text-2xl font-serif italic tracking-widest uppercase opacity-90 mb-8">
                        Hardware Security
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/blog" className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                            Read Posts
                        </Link>
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto py-20 px-6 font-serif">

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
