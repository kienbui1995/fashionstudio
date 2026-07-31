import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import {
  HOME_FAQS,
  SITE,
  faqJsonLd,
  organizationJsonLd,
  seoHead,
  softwareJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { BLOG_POSTS } from "@/lib/blog";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: `${SITE.name} — ${SITE.tagline}`,
      description: SITE.description,
      path: "/",
      keywords: [
        "phần mềm try-on thời trang",
        "công cụ local brand",
        "tạo video tiktok shop",
      ],
    }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareJsonLd()} />
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      <div className="min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link to="/" className="font-display text-lg font-semibold tracking-tight">
              {SITE.name}
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-fg-muted md:flex" aria-label="Chính">
              <a href="#tinh-nang" className="hover:text-fg">Tính năng</a>
              <a href="#cho-ai" className="hover:text-fg">Cho ai</a>
              <a href="#faq" className="hover:text-fg">Hỏi đáp</a>
              <Link to="/blog" className="hover:text-fg">Blog</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/studio">Vào studio</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          {/* Hero — single H1 for SEO */}
          <section className="relative overflow-hidden border-b border-border">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,165,116,0.12),_transparent_55%)]" />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                  Studio thời trang · Việt Nam
                </p>
                <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
                  Try-on & video TikTok cho{" "}
                  <span className="text-accent">local brand</span> và SME may mặc
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
                  {SITE.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link to="/studio">
                      Dùng free <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/register">Tạo gian hàng</Link>
                  </Button>
                </div>
                <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-subtle">
                  <li>Tách nền AI</li>
                  <li>Cảnh VN / Gen Z</li>
                  <li>MP4 9:16 TikTok Shop</li>
                  <li>SEO caption</li>
                </ul>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-wider text-fg-subtle">Luồng 1 màn hình</p>
                <ol className="mt-4 space-y-4">
                  {[
                    { t: "Upload mẫu + sản phẩm", d: "Áo, quần, túi — tách nền thông minh" },
                    { t: "Ghép cảnh Việt Nam", d: "Phố cổ, café pastel, rooftop Sài Gòn" },
                    { t: "Xuất Reels / TikTok Shop", d: "Hook 3s · safe-zone · watermark brand" },
                    { t: "SEO & đăng bán", d: "Caption keyword · listing · checklist" },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-medium text-accent">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{s.t}</p>
                        <p className="text-sm text-fg-muted">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section id="tinh-nang" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Tính năng studio cho brand bán online
            </h2>
            <p className="mt-3 max-w-2xl text-fg-muted">
              Không chỉ template — pipeline từ ảnh sản phẩm đến nội dung sẵn đăng
              Shopee, TikTok, Facebook.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Camera, title: "Try-on & cutout", body: "Ghép layer quần áo, túi, phụ kiện lên mẫu." },
                { icon: Clapperboard, title: "Video 9:16", body: "MP4 TikTok / Reels, preset Shop & FYP." },
                { icon: Search, title: "SEO TikTok + Web", body: "Keyword caption, meta website, blog." },
                { icon: Store, title: "Gian hàng SME", body: "Catalog, R&D, marketing, vai trò team." },
              ].map((f) => (
                <article
                  key={f.title}
                  className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5"
                >
                  <f.icon className="size-5 text-accent" aria-hidden />
                  <h3 className="mt-3 font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="cho-ai" className="border-y border-border bg-bg-elevated">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <h2 className="font-display text-3xl font-semibold">Dành cho ai?</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { t: "Local brand", d: "Cần lookbook & Reels đều đặn, ít budget studio." },
                  { t: "Shop Shopee / TikTok", d: "Muốn ảnh model + video gắn giỏ nhanh." },
                  { t: "Xưởng may / SME", d: "R&D mẫu, costing, content marketing một chỗ." },
                ].map((c) => (
                  <article key={c.t} className="rounded-[var(--radius-lg)] border border-border bg-bg p-5">
                    <h3 className="font-medium text-accent">{c.t}</h3>
                    <p className="mt-2 text-sm text-fg-muted">{c.d}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-semibold">Blog hướng dẫn</h2>
                <p className="mt-2 text-fg-muted">Bài viết giúp brand học cách làm nội dung và được tìm thấy trên Google.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/blog">Xem tất cả</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {BLOG_POSTS.map((p) => (
                <article key={p.slug} className="flex flex-col rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5">
                  <time className="text-xs text-fg-subtle" dateTime={p.date}>{p.date}</time>
                  <h3 className="mt-2 font-medium leading-snug">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: p.slug }}
                      className="hover:text-accent"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-fg-muted">{p.description}</p>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="mt-4 text-sm text-accent"
                  >
                    Đọc tiếp →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section id="faq" className="border-t border-border bg-bg-elevated">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
              <h2 className="font-display text-3xl font-semibold">Câu hỏi thường gặp</h2>
              <div className="mt-8 space-y-4">
                {HOME_FAQS.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-[var(--radius-lg)] border border-border bg-bg p-4"
                  >
                    <summary className="cursor-pointer list-none font-medium marker:content-none">
                      <span className="flex items-center justify-between gap-2">
                        {f.q}
                        <Sparkles className="size-4 shrink-0 text-accent opacity-60 group-open:opacity-100" />
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-fg-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-3xl font-semibold">Bắt đầu miễn phí trong studio</h2>
            <p className="mx-auto mt-3 max-w-lg text-fg-muted">
              Không cần cài app — mở trình duyệt, tải sản phẩm, ra look + video.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link to="/studio">Mở Fash Studio</Link>
            </Button>
          </section>
        </main>

        <footer className="border-t border-border py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:justify-between sm:px-6">
            <div>
              <p className="font-display font-semibold">{SITE.name}</p>
              <p className="mt-1 max-w-sm text-sm text-fg-subtle">{SITE.tagline}</p>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm text-fg-muted" aria-label="Footer">
              <Link to="/studio" className="hover:text-fg">Studio</Link>
              <Link to="/blog" className="hover:text-fg">Blog</Link>
              <Link to="/register" className="hover:text-fg">Đăng ký</Link>
              <a href="/sitemap.xml" className="hover:text-fg">Sơ đồ trang</a>
              <a href="/robots.txt" className="hover:text-fg">Robots</a>
            </nav>
          </div>
          <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-fg-subtle sm:px-6">
            © {new Date().getFullYear()} {SITE.name}. Try-on · TikTok · Local brand VN.
          </p>
        </footer>
      </div>
    </>
  );
}
