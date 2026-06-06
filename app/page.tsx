import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HotIssuesList from "@/components/HotIssuesList";
import LabLogsList from "@/components/LabLogsList";
import { getAllPosts as getAllBlogPosts } from "@/lib/blog";
import { getTopIssues } from "@/lib/news-tracking";
import { getAllPosts as getAllNotices } from "@/lib/notice";
import { getServerUserFromCookie } from "@/lib/auth-server";

export const dynamic = 'force-dynamic'; // Ensure hot issues are fresh

export default async function Home() {
  const user = await getServerUserFromCookie();
  const permGroup = user?.permission_group !== undefined ? Number(user.permission_group) : -1;
  const hasAccess = permGroup >= 3;

  // Fetch blogs
  let blogPosts = await getAllBlogPosts();
  
  if (!hasAccess) {
    blogPosts = blogPosts.filter(post => 
      post.tag.split(",").map(t => t.trim()).includes("public")
    );
  }

  // Fetch news articles (Hot Issues)
  const topIssues = getTopIssues(100);

  // Fetch notices for pinned items
  const notices = await getAllNotices();
  const visibleNotices = hasAccess 
    ? notices 
    : notices.filter(p => p.tag.split(",").map(t => t.trim()).includes("public"));

  const pinnedNotices = visibleNotices
    .filter(p => p.tag.split(",").map(t => t.trim().toLowerCase()).includes("pinned"))
    .slice(0, 3);

  return (
    <main className="min-h-screen font-sans bg-background text-foreground">

      {/* Design System Grid / Content Section */}
      <section className="max-w-7xl mx-auto px-6 pt-32 py-12">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left Column: Intro & Hot Issues */}
          {/* Using contents on mobile so children act as direct grid items, block on desktop */}
          <div className="contents md:block space-y-12">
            {/* Intro (Order 1 on Mobile) */}
            <div className="space-y-6 order-1">
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

            {/* Hot Issues Section (Feed - Order 4 on Mobile) */}
            <div className="order-4">
              <HotIssuesList issues={topIssues} />
            </div>
          </div>

          {/* Right Column: Pinned Notices & Laboratory Logs */}
          {/* Using contents on mobile so children act as direct grid items, block on desktop */}
          <div className="contents md:block space-y-12">
            {/* Pinned Notices Section (Notice - Order 2 on Mobile) */}
            <div className="order-2">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
                <span className="block text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-foreground" />
                  Notice (Pinned)
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                  Announcement
                </span>
              </div>
              
              <div className="space-y-6">
                {pinnedNotices.map((notice) => (
                  <Link href={`/notice/${notice.slug}`} key={notice.slug} className="block group">
                    <div className="flex items-center gap-4 mb-2 text-xs tracking-wider uppercase font-sans text-gray-400">
                      <span className="text-foreground font-bold flex items-center gap-1">📌 PINNED</span>
                      <span>{notice.date}</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold mb-2 group-hover:underline decoration-1 underline-offset-4">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {notice.excerpt}
                    </p>
                  </Link>
                ))}
                {pinnedNotices.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 italic text-sm">No pinned notices.</p>
                )}
              </div>
            </div>

            {/* Laboratory Logs Section (Blog - Order 3 on Mobile) */}
            <div className="order-3">
              <LabLogsList posts={blogPosts} />
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
