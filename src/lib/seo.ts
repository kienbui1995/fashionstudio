/** Website SEO config for Fash Studio (local brand VN). */

export const SITE = {
  name: "Fash Studio",
  legalName: "Fash Studio",
  tagline: "Try-on AI & video TikTok cho local brand Việt",
  description:
    "Studio thời trang online cho local brand và SME Việt Nam: try-on sản phẩm, tách nền AI, video TikTok Shop 9:16, SEO caption, catalog và vận hành gian hàng.",
  /** Public origin — overridden at runtime when possible */
  url: "https://fash.studio",
  locale: "vi_VN",
  lang: "vi",
  twitter: "@fashstudio",
  keywords: [
    "local brand việt nam",
    "try-on thời trang",
    "tiktok shop fashion",
    "studio thời trang online",
    "tách nền quần áo",
    "video reels thời trang",
    "may mặc SME",
    "lookbook digital",
    "fashion design vietnam",
    "fash studio",
  ],
  ogImage: "/og-default.svg",
  themeColor: "#0c0b0a",
} as const;

export type PageSeo = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  ogType?: "website" | "article" | "product";
  noindex?: boolean;
  image?: string;
};

export function absoluteUrl(path = "/", origin?: string): string {
  const base = (origin || SITE.url).replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p === "/" ? "" : p}` || base;
}

export function fullTitle(title: string): string {
  if (!title || title === SITE.name) return `${SITE.name} — ${SITE.tagline}`;
  if (title.includes(SITE.name)) return title;
  return `${title} | ${SITE.name}`;
}

export function buildMeta(page: PageSeo, origin?: string) {
  const title = fullTitle(page.title);
  const description = page.description.slice(0, 160);
  const url = absoluteUrl(page.path || "/", origin);
  const image = absoluteUrl(page.image || SITE.ogImage, origin);
  const keywords = [...SITE.keywords, ...(page.keywords || [])].join(", ");

  return {
    title,
    description,
    url,
    image,
    keywords,
    noindex: page.noindex ?? false,
    ogType: page.ogType ?? "website",
  };
}

/** TanStack Router head() shape */
export function seoHead(page: PageSeo, origin?: string) {
  const m = buildMeta(page, origin);
  return {
    meta: [
      { title: m.title },
      { name: "description", content: m.description },
      { name: "keywords", content: m.keywords },
      {
        name: "robots",
        content: m.noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1",
      },
      { name: "author", content: SITE.name },
      { name: "theme-color", content: SITE.themeColor },
      { property: "og:type", content: m.ogType },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: SITE.locale },
      { property: "og:title", content: m.title },
      { property: "og:description", content: m.description },
      { property: "og:url", content: m.url },
      { property: "og:image", content: m.image },
      { property: "og:image:alt", content: m.title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: m.title },
      { name: "twitter:description", content: m.description },
      { name: "twitter:image", content: m.image },
      ...(SITE.twitter
        ? [{ name: "twitter:site", content: SITE.twitter }]
        : []),
    ],
    links: [
      { rel: "canonical", href: m.url },
      { rel: "alternate", hrefLang: "vi", href: m.url },
    ],
  };
}

export function organizationJsonLd(origin?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    url: absoluteUrl("/", origin),
    logo: absoluteUrl("/favicon.svg", origin),
    description: SITE.description,
    areaServed: "VN",
    knowsLanguage: ["vi", "en"],
  };
}

export function softwareJsonLd(origin?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
    },
    description: SITE.description,
    url: absoluteUrl("/", origin),
    inLanguage: "vi",
    featureList: [
      "Try-on thời trang AI",
      "Tách nền sản phẩm",
      "Video TikTok 9:16",
      "SEO caption TikTok",
      "Quản lý gian hàng local brand",
    ],
  };
}

export function websiteJsonLd(origin?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/", origin),
    description: SITE.description,
    inLanguage: "vi",
    potentialAction: {
      "@type": "SearchAction",
      target: absoluteUrl("/studio?q={search_term_string}", origin),
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqJsonLd(
  faqs: { q: string; a: string }[],
  origin?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
    url: absoluteUrl("/", origin),
  };
}

export const HOME_FAQS = [
  {
    q: "Fash Studio là gì?",
    a: "Fash Studio là nền tảng studio thời trang online cho local brand và SME Việt Nam: try-on sản phẩm, tạo lookbook, xuất video TikTok Shop và quản lý gian hàng.",
  },
  {
    q: "Có hỗ trợ TikTok Shop không?",
    a: "Có. Bạn xuất video 9:16 MP4, caption SEO, listing và checklist gắn giỏ TikTok Shop ngay trong studio.",
  },
  {
    q: "Local brand nhỏ có dùng được không?",
    a: "Có. Gói free đủ try-on và video; phù hợp xưởng may, shop Shopee/TikTok và brand mới.",
  },
  {
    q: "Ảnh sản phẩm có tách nền AI không?",
    a: "Có. Upload áo, quần, túi — engine tách nền và ghép lên mẫu + cảnh Việt Nam / Gen Z.",
  },
];
