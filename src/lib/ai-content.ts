/** Lightweight on-device content templates for fashion / TikTok copy. */

import { buildTikTokCaption, buildTikTokShopListing } from "@/lib/tiktok-pack";
import { buildTikTokSeo as buildSeoResult, scoreTikTokCaption } from "@/lib/tiktok-seo";

export type AiContentKind =
  | "caption"
  | "tiktok_seo"
  | "tiktok_shop"
  | "full_post"
  | "hook"
  | "hashtags"
  | "product_title"
  | "email_blast";

export type AiTone =
  | "friendly"
  | "luxury"
  | "genz"
  | "sale"
  | "minimal"
  | "story"
  | "hype"
  | "soft";

/** Engine ids used by AI panel */
export type AiEngine = "fast" | "rich" | "seo" | "template" | "local-rules";
export type AiEngineId = AiEngine;

export const AI_KIND_OPTIONS: {
  id: AiContentKind;
  label: string;
  hint: string;
}[] = [
  { id: "caption", label: "Caption ngắn", hint: "1–3 dòng đăng mạng" },
  { id: "tiktok_seo", label: "SEO TikTok", hint: "Từ khóa + hashtag + điểm" },
  {
    id: "tiktok_shop",
    label: "Listing TikTok Shop",
    hint: "Title + bullets listing",
  },
  { id: "full_post", label: "Bài đăng đầy đủ", hint: "Caption + CTA + hashtag" },
  { id: "hook", label: "Hook 3s", hint: "Câu mở video" },
  { id: "hashtags", label: "Hashtag pack", hint: "4–8 tag ngách" },
  { id: "product_title", label: "Tiêu đề SP", hint: "Shopee / Shop title" },
  { id: "email_blast", label: "Email marketing", hint: "Subject + body ngắn" },
];

export const AI_TONE_OPTIONS: { id: AiTone; label: string }[] = [
  { id: "friendly", label: "Thân thiện" },
  { id: "luxury", label: "Sang trọng / tối giản" },
  { id: "genz", label: "Gen Z" },
  { id: "hype", label: "Hype / sôi động" },
  { id: "soft", label: "Soft girl dễ thương" },
  { id: "sale", label: "Flash sale" },
  { id: "minimal", label: "Tối giản" },
  { id: "story", label: "Kể chuyện" },
];

export type GenerateInput = {
  kind?: AiContentKind;
  tone?: AiTone;
  productName: string;
  brand?: string;
  price?: string;
  scene?: string;
  material?: string;
  audience?: string;
  extra?: string;
  engine?: AiEngine;
  /** Panel fields */
  kind_label?: string;
  vibe?: string;
  language?: string;
};

/** Structured result for AiContentPanel */
export type GenerateResult = {
  engine: AiEngine;
  kind: AiContentKind;
  title: string;
  body: string;
  meta?: Record<string, string | number | string[]>;
};

/** Extended result with panel extras (compatible with GenerateResult). */
export type AiContentResult = GenerateResult & {
  captions?: string[];
  hooks?: string[];
  productDescription?: string;
  storyScript?: string[];
};

const TONE_FLAIR: Record<
  string,
  { emoji: string; cta: string; vibe: string }
> = {
  friendly: {
    emoji: "💕",
    cta: "Inbox mình size nha",
    vibe: "dễ mặc, dễ phối",
  },
  luxury: {
    emoji: "✨",
    cta: "Đặt trước — số lượng giới hạn",
    vibe: "form chuẩn, chất liệu chọn lọc",
  },
  genz: {
    emoji: "🔥",
    cta: "Giỏ vàng liền tay",
    vibe: "auto có ảnh đăng",
  },
  hype: {
    emoji: "⚡",
    cta: "Chốt đơn trong hôm nay",
    vibe: "viral-ready, chốt nhanh",
  },
  soft: {
    emoji: "🌸",
    cta: "Inbox tone pastel nhé",
    vibe: "soft girl, nhẹ nhàng",
  },
  sale: {
    emoji: "⚡",
    cta: "Chốt đơn trong hôm nay",
    vibe: "giá tốt, ship nhanh",
  },
  minimal: {
    emoji: "—",
    cta: "Shop để biết thêm",
    vibe: "clean, timeless",
  },
  story: {
    emoji: "🌿",
    cta: "Kể mình nghe bạn mix sao nhé",
    vibe: "mặc là thấy mình xinh hơn",
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "fashion"
  );
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}

function hashPick(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function flairFor(tone?: AiTone) {
  return TONE_FLAIR[tone || "friendly"] || TONE_FLAIR.friendly!;
}

/** Main generator — returns AiContentResult for panel, rich enough for all kinds. */
export async function generateWithEngine(
  input: GenerateInput,
): Promise<AiContentResult> {
  const engine: AiEngine = input.engine ?? "template";
  const wait =
    engine === "rich" ? 280 : engine === "seo" ? 220 : engine === "local-rules" ? 180 : 80;
  await delay(wait);

  const tone = input.tone ?? "genz";
  const flair = flairFor(tone);
  const product = input.productName.trim() || "Sản phẩm thời trang";
  const brand = input.brand?.trim() || "";
  const price = input.price?.trim() || "";
  const scene = input.scene?.trim() || input.vibe?.trim() || "";
  const kind: AiContentKind =
    input.kind ||
    (engine === "seo" ? "tiktok_seo" : engine === "rich" ? "full_post" : "caption");

  const captions = [
    `${product}${brand ? ` · ${brand}` : ""} ${flair.emoji}\n${flair.vibe}${scene ? ` · ${scene}` : ""}${price ? `\nGiá ${price}` : ""}\n${flair.cta}`,
    buildTikTokCaption({
      productName: product,
      hook: flair.vibe,
      price,
      cta: flair.cta,
      scene,
    }),
    `${product} ${flair.emoji} — ${flair.vibe}. ${flair.cta} #${slug(product)} #localbrand #fyp`,
  ];

  const hooks = [
    `${flair.emoji} ${product} ${flair.vibe} — xem 3 giây là mê.`,
    `Ai đang tìm ${product.toLowerCase()}? Đây này ${flair.emoji}`,
    `POV: mặc ${product} đi ${scene || "café"} là đúng bài.`,
    price
      ? `Chỉ ${price} cho ${product} — ${flair.cta}`
      : `${product} mới về — ${flair.cta}`,
  ];

  const listing = buildTikTokShopListing({
    productName: product,
    brand,
    price,
    material: input.material,
    scene,
  });

  const productDescription = listing.description;

  const storyScript = [
    `0–3s: Close-up ${product} + text "${product}"`,
    `3–7s: Full body try-on, scene ${scene || "studio"}`,
    `7–11s: Detail vải / form + giá ${price || "inbox"}`,
    `11–15s: CTA ${flair.cta}`,
  ];

  if (kind === "tiktok_seo" || engine === "seo") {
    const seo = buildSeoResult({
      productName: product,
      brand,
      price,
      scene,
      extraKeywords: input.extra ? input.extra.split(/[,;]/) : undefined,
    });
    return {
      engine,
      kind: "tiktok_seo",
      title: `SEO · ${seo.primaryKeyword}`,
      body: seo.caption,
      captions: [seo.caption, ...captions.slice(0, 2)],
      hooks: [seo.voiceHook, ...hooks.slice(0, 2)],
      productDescription,
      storyScript,
      meta: {
        score: seo.score,
        primaryKeyword: seo.primaryKeyword,
        hashtags: seo.hashtags,
        tips: seo.tips,
      },
    };
  }

  if (kind === "tiktok_shop") {
    return {
      engine,
      kind: "tiktok_shop",
      title: listing.title,
      body: [listing.description, "", ...listing.bullets.map((b) => `• ${b}`)].join(
        "\n",
      ),
      captions,
      hooks,
      productDescription,
      storyScript,
      meta: {
        hashtags: listing.hashtags,
        skuHint: listing.skuHint,
      },
    };
  }

  if (kind === "hook") {
    const body = hooks[hashPick(product + tone, hooks.length)]!;
    return {
      engine,
      kind: "hook",
      title: "Hook 3s",
      body,
      captions: [body, ...captions],
      hooks,
      productDescription,
      storyScript,
    };
  }

  if (kind === "hashtags") {
    const tags = unique([
      `#${slug(product)}`,
      "#thoitrangnu",
      "#localbrand",
      "#outfit",
      tone === "genz" || tone === "soft" ? "#softgirl" : "#fashion",
      "#xuhuong",
      brand ? `#${slug(brand)}` : "#fyp",
      scene ? `#${slug(scene)}` : "#tryon",
    ]).slice(0, 8);
    const body = tags.join(" ");
    return {
      engine,
      kind: "hashtags",
      title: "Hashtag pack",
      body,
      captions: [body],
      hooks,
      productDescription,
      storyScript,
      meta: { hashtags: tags },
    };
  }

  if (kind === "product_title") {
    const body = [product, brand, input.material, price ? `giá ${price}` : "", "free ship"]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 120);
    return {
      engine,
      kind: "product_title",
      title: "Tiêu đề SP",
      body,
      captions: [body, ...captions],
      hooks,
      productDescription,
      storyScript,
    };
  }

  if (kind === "email_blast") {
    const subject = `${flair.emoji} ${product}${price ? ` — ${price}` : ""} vừa lên kệ`;
    const body = [
      `Subject: ${subject}`,
      "",
      `Chào bạn,`,
      `${product}${brand ? ` từ ${brand}` : ""} ${flair.vibe}.`,
      scene ? `Gợi ý mix scene ${scene}.` : "",
      input.extra || "",
      "",
      flair.cta,
      "— Fash Studio",
    ]
      .filter((l) => l !== undefined)
      .join("\n");
    return {
      engine,
      kind: "email_blast",
      title: subject,
      body,
      captions: [subject],
      hooks,
      productDescription: body,
      storyScript,
    };
  }

  if (kind === "full_post" || engine === "rich") {
    const cap = captions[1] || captions[0]!;
    const scored = scoreTikTokCaption(cap, product.toLowerCase());
    const body = [cap, "", input.extra || "", "", `// SEO score: ${scored.score}/100`]
      .filter((l) => l !== undefined)
      .join("\n")
      .trim();
    return {
      engine,
      kind: "full_post",
      title: `Post · ${product}`,
      body,
      captions,
      hooks,
      productDescription,
      storyScript,
      meta: { score: scored.score, tips: scored.tips },
    };
  }

  // default caption
  return {
    engine,
    kind: "caption",
    title: "Caption",
    body: captions[0]!,
    captions,
    hooks,
    productDescription,
    storyScript,
  };
}
