import { Link, createFileRoute } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/lib/blog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    seoHead({
      title: "Blog local brand & TikTok thời trang",
      description:
        "Hướng dẫn try-on, TikTok Shop, SEO caption cho local brand và shop thời trang Việt Nam.",
      path: "/blog",
      keywords: ["blog thời trang", "hướng dẫn tiktok shop", "local brand tip"],
    }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
          <Link to="/" className="text-sm text-fg-muted hover:text-fg">← Fash Studio</Link>
          <span className="font-display font-medium">Blog</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold">Blog SEO thời trang</h1>
        <p className="mt-3 text-fg-muted">
          Bài viết tối ưu từ khóa cho local brand, try-on và TikTok Shop Việt Nam.
        </p>
        <ul className="mt-10 space-y-6">
          {BLOG_POSTS.map((p) => (
            <li key={p.slug} className="border-b border-border pb-6">
              <time className="text-xs text-fg-subtle" dateTime={p.date}>{p.date}</time>
              <h2 className="mt-1 text-xl font-medium">
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="hover:text-accent">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-fg-muted">{p.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
