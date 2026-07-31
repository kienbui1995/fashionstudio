import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_POSTS, getPost } from "@/lib/blog";
import { absoluteUrl, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return seoHead({
        title: "Bài viết",
        description: "Blog Fash Studio",
        path: "/blog",
      });
    }
    return seoHead({
      title: loaderData.title,
      description: loaderData.description,
      path: `/blog/${loaderData.slug}`,
      keywords: loaderData.keywords,
      ogType: "article",
    });
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const post = Route.useLoaderData();
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Fash Studio" },
    publisher: { "@type": "Organization", name: "Fash Studio" },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    inLanguage: "vi",
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="min-h-dvh">
      <JsonLd data={articleLd} />
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
          <Link to="/blog" className="text-sm text-fg-muted hover:text-fg">← Blog</Link>
        </div>
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12">
        <time className="text-xs text-fg-subtle" dateTime={post.date}>{post.date}</time>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-fg-muted">{post.description}</p>
        <div className="prose mt-10 space-y-4 text-base leading-relaxed text-fg-muted">
          {post.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <aside className="mt-12 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
          <p className="font-medium">Thử trên Fash Studio</p>
          <p className="mt-1 text-sm text-fg-muted">
            Áp dụng try-on + video TikTok cho brand của bạn.
          </p>
          <Link to="/studio" className="mt-3 inline-block text-sm text-accent">
            Mở Studio →
          </Link>
        </aside>
        <nav className="mt-10 border-t border-border pt-6">
          <p className="text-xs uppercase tracking-wider text-fg-subtle">Bài khác</p>
          <ul className="mt-3 space-y-2">
            {BLOG_POSTS.filter((p) => p.slug !== post.slug).map((p) => (
              <li key={p.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="text-sm hover:text-accent"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  );
}
