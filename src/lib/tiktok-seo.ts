/** TikTok SEO helpers: caption builder, score, fashion keywords. */

export const TT_FASHION_KEYWORDS: string[] = [
  "áo lụa nữ",
  "quần linen",
  "váy babydoll",
  "set đồ nữ",
  "local brand việt",
  "túi da mini",
  "giày sneakers nữ",
  "áo croptop",
  "quần ống rộng",
  "đầm dự tiệc",
  "phối đồ đi làm",
  "outfit gen z",
  "thời trang công sở",
  "soft girl style",
  "street style sài gòn",
  "try on haul",
  "tiktok shop thời trang",
  "free ship nội thành",
  "size chart nữ",
  "chất liệu linen",
];

export type TikTokSeoResult = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  caption: string;
  hashtags: string[];
  onScreenText: string;
  voiceHook: string;
  score: number;
  tips: string[];
};

export function buildTikTokSeo(input: {
  productName: string;
  category?: string;
  scene?: string;
  brand?: string;
  price?: string;
  extraKeywords?: string[];
}): TikTokSeoResult {
  const product = input.productName.trim() || "sản phẩm thời trang";
  const brand = input.brand?.trim() || "";
  const scene = input.scene?.trim() || "";
  const price = input.price?.trim() || "";

  const primary =
    pickPrimaryKeyword(product, input.category, input.extraKeywords) ||
    product.toLowerCase();

  const secondary = unique([
    ...(input.extraKeywords ?? []),
    ...TT_FASHION_KEYWORDS.filter(
      (k) => k !== primary && (product.toLowerCase().includes(k.split(" ")[0]!) || Math.random() > 0.7),
    ).slice(0, 3),
    brand ? brand.toLowerCase() : "",
    scene ? `outfit ${scene}` : "",
  ])
    .filter(Boolean)
    .slice(0, 5);

  const hashtags = unique([
    `#${toTag(primary)}`,
    "#thoitrangnu",
    "#localbrand",
    "#xuhuong",
    brand ? `#${toTag(brand)}` : "#fyp",
    "#tiktokshop",
  ]).slice(0, 6);

  const caption = [
    `${primary} — ${product}${brand ? ` | ${brand}` : ""}`,
    price ? `Giá ${price} · Inbox size` : "Inbox size / giỏ vàng",
    scene ? `Look scene ${scene}` : "Try-on digital chuẩn form",
    secondary.slice(0, 2).join(" · "),
    hashtags.join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const onScreenText = primary.slice(0, 28);
  const voiceHook = `Hôm nay thử ${primary} — form này xinh khỏi chỉnh luôn.`;

  const scored = scoreTikTokCaption(caption, primary);

  return {
    primaryKeyword: primary,
    secondaryKeywords: secondary,
    caption,
    hashtags,
    onScreenText,
    voiceHook,
    score: scored.score,
    tips: scored.tips,
  };
}

export type CaptionScore = {
  score: number;
  tips: string[];
  breakdown: {
    keywordFront: boolean;
    lengthOk: boolean;
    hashtagCount: number;
    hasCta: boolean;
    hasEmoji: boolean;
  };
};

export function scoreTikTokCaption(
  caption: string,
  primaryKeyword?: string,
): CaptionScore {
  const tips: string[] = [];
  let score = 40;
  const text = caption.trim();
  const lower = text.toLowerCase();
  const firstLine = text.split("\n")[0] || text;
  const kw = (primaryKeyword || "").toLowerCase().trim();

  const keywordFront = kw
    ? firstLine.toLowerCase().includes(kw)
    : TT_FASHION_KEYWORDS.some((k) => firstLine.toLowerCase().includes(k));

  if (keywordFront) score += 20;
  else tips.push("Đưa primary keyword lên dòng 1 caption.");

  const len = text.length;
  const lengthOk = len >= 40 && len <= 300;
  if (lengthOk) score += 15;
  else if (len < 40) tips.push("Caption hơi ngắn — thêm CTA và 1 lợi ích.");
  else tips.push("Caption dài — rút gọn dưới ~300 ký tự cho mobile.");

  const tags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  const hashtagCount = tags.length;
  if (hashtagCount >= 3 && hashtagCount <= 6) score += 15;
  else if (hashtagCount > 6) {
    score += 5;
    tips.push("Bớt hashtag (ideal 4–6).");
  } else tips.push("Thêm 3–5 hashtag ngách + broad.");

  const hasCta =
    /inbox|giỏ|cart|mua|order|size|link|comment|theo dõi|follow/i.test(text);
  if (hasCta) score += 10;
  else tips.push("Thêm CTA (inbox size / giỏ vàng).");

  const hasEmoji = /\p{Extended_Pictographic}/u.test(text);
  if (hasEmoji) score += 5;
  else tips.push("1–3 emoji giúp caption dễ quét.");

  if (/\n/.test(text)) score += 5;

  score = Math.min(100, Math.max(0, score));
  if (score >= 80 && tips.length === 0) {
    tips.push("Caption ổn — sẵn sàng đăng khung giờ 18–22h VN.");
  }

  return {
    score,
    tips,
    breakdown: { keywordFront, lengthOk, hashtagCount, hasCta, hasEmoji },
  };
}

function pickPrimaryKeyword(
  product: string,
  category?: string,
  extra?: string[],
): string {
  const pool = [
    ...(extra ?? []),
    product,
    category ?? "",
    ...TT_FASHION_KEYWORDS,
  ]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const productLower = product.toLowerCase();
  const hit = TT_FASHION_KEYWORDS.find((k) => productLower.includes(k) || k.includes(productLower.split(" ")[0]!));
  if (hit) return hit;
  return pool[0] || "thời trang nữ";
}

function toTag(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 28) || "fashion";
}

function unique(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const k = a.toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}
