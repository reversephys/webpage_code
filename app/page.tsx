import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HotIssues from "@/components/HotIssues";
import { getLatestPosts } from "@/lib/blog";
import { getTopIssues } from "@/lib/news-tracking";
import { getServerUserFromCookie } from "@/lib/auth-server";

export const dynamic = 'force-dynamic'; // Ensure hot issues are fresh

export default async function Home() {
  const user = await getServerUserFromCookie();
  const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
  const hasAccess = permGroup >= 3;

  // Fetch more posts to filter and show the latest 2 public ones for guests
  let latestPosts = await getLatestPosts(10);
  
  if (!hasAccess) {
    latestPosts = latestPosts.filter(post => 
      post.tag.split(",").map(t => t.trim()).includes("public")
    );
  }
  
  // Show only top 2 after filtering
  latestPosts = latestPosts.slice(0, 2);

  const topIssues = getTopIssues(2);

  return (
    <main className="min-h-screen font-sans bg-background text-foreground">

      {/* Design System Grid / Content Section */}
      <section className="max-w-7xl mx-auto px-6 pt-32 py-12">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left Column: Intro */}
          <div className="space-y-6 md:sticky md:top-24">
            <h2 className="text-5xl md:text-6xl font-serif font-bold leading-tight">
              Unlocking the <br /> <span className="italic">Unknown.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-serif leading-relaxed">
              We explore the depths of embedded systems, dissecting hardware to understand the soul of the machine.
              Our research focuses on hardware security, side-channel analysis, and fault injection.
            </p>
            <Link href="/about" className="inline-flex items-center text-lg uppercase tracking-widest border-b border-black dark:border-white pb-1 hover:pb-2 transition-all">
              About the Lab <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Right Column: Latest Blog Posts */}
          <div className="space-y-10">

            {/* Hot Issues Section */}
            <HotIssues issues={topIssues} />

            {/* Internal Blog Section Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
              <span className="block text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-foreground" />
                Laboratory Logs
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-widest">
                Internal Research
              </span>
            </div>

            {latestPosts.map((post, index) => (
              <Link href={`/blog/${post.slug}`} key={post.slug}>
                <div className={`group cursor-pointer ${index > 0 ? 'pt-6 mt-6' : ''}`}>
                  <span className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {post.tag}
                  </span>
                  <h3 className="text-2xl font-serif font-bold mb-2 group-hover:underline decoration-1 underline-offset-4">
                    {post.title}
                  </h3>
                  <div className="flex gap-6 items-stretch">
                    <p className="flex-1 min-w-0 text-gray-600 dark:text-gray-400 leading-relaxed">
                      {post.excerpt}
                    </p>
                    {post.thumbnail && (
                      <div className="w-[120px] shrink-0 relative overflow-hidden rounded-sm">
                        <Image
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/0 transition-colors" />
                      </div>
                    )}

                  </div>
                </div>
              </Link>
            ))}

            {latestPosts.length === 0 && (
              <>
                <div className="group cursor-pointer">
                  <span className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Blog</span>
                  <h3 className="text-3xl font-serif font-bold mb-4">No posts yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Posts will appear here once content is added.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

    </main>
  );
}
