/** Rule-based trend suggestions for fashion products (VN / Gen Z). */

export type TrendSuggestion = {
  id: string;
  title: string;
  score: number;
  reason: string;
  hashtags: string[];
  scenes: string[];
  hooks: string[];
  platforms: ("tiktok" | "instagram" | "shopee" | "facebook")[];
  season: string;
};

export type TrendQuery = {
  productName: string;
  category?: string;
  kind?: string;
  colors?: string[];
  audience?: string;
  brand?: string;
};

const TREND_BANK: {
  match: RegExp;
  title: string;
  score: number;
  reason: string;
  hashtags: string[];
  scenes: string[];
  hooks: string[];
  platforms: TrendSuggestion["platforms"];
  season: string;
}[] = [
  {
    match: /lụa|silk|blouse|áo sơ mi|áo lụa/i,
    title: "Áo lụa công sở nhẹ",
    score: 92,
    reason: "Search TikTok VN cao cho áo lụa nữ + look đi làm.",
    hashtags: ["#aoluanu", "#congso", "#localbrand"],
    scenes: ["studio-cream", "hanoi-old", "cafe-pastel"],
    hooks: ["Áo lụa form vừa — mặc đi làm / coffee date"],
    platforms: ["tiktok", "shopee", "instagram"],
    season: "all-year",
  },
  {
    match: /linen|lanh|ống rộng|quần/i,
    title: "Linen ống rộng",
    score: 90,
    reason: "Trend hè + du lịch biển / café outdoor.",
    hashtags: ["#quanlinen", "#ongrong", "#outfithe"],
    scenes: ["danang-beach", "cafe-pastel", "saigon-rooftop"],
    hooks: ["Linen thoáng — check-in là có ảnh"],
    platforms: ["tiktok", "instagram"],
    season: "summer",
  },
  {
    match: /váy|dress|babydoll|đầm/i,
    title: "Váy soft girl / babydoll",
    score: 88,
    reason: "Gen Z + soft girl palette đang hot trên FYP.",
    hashtags: ["#softgirl", "#vaynu", "#babydoll"],
    scenes: ["soft-girl", "cafe-pastel", "studio-cream"],
    hooks: ["Váy pastel đi café — khỏi chỉnh app"],
    platforms: ["tiktok", "instagram"],
    season: "spring-summer",
  },
  {
    match: /túi|bag|clutch|đeo chéo/i,
    title: "Túi mini statement",
    score: 86,
    reason: "Accessory convert tốt trên TikTok Shop (close-up).",
    hashtags: ["#tuixachnu", "#bag", "#phukien"],
    scenes: ["saigon-rooftop", "neon-night", "hanoi-old"],
    hooks: ["Túi mini xinh xỉu — mix street"],
    platforms: ["tiktok", "shopee"],
    season: "all-year",
  },
  {
    match: /giày|sneaker|sandal|dép/i,
    title: "Footwear UGC",
    score: 84,
    reason: "UGC try-on chân + street scene tăng watch time.",
    hashtags: ["#giaynu", "#sneakers", "#streetstyle"],
    scenes: ["saigon-rooftop", "neon-night", "danang-beach"],
    hooks: ["Đôi này đi cả ngày không đau chân"],
    platforms: ["tiktok", "shopee", "facebook"],
    season: "all-year",
  },
  {
    match: /croptop|hoodie|street|jean/i,
    title: "Street Gen Z",
    score: 85,
    reason: "Rooftop + neon night match streetwear feed.",
    hashtags: ["#streetstyle", "#genz", "#outfit"],
    scenes: ["neon-night", "saigon-rooftop"],
    hooks: ["Street look 10s — save để phối"],
    platforms: ["tiktok", "instagram"],
    season: "all-year",
  },
  {
    match: /jewelry|nhẫn|vòng|dây chuyền|khuyên/i,
    title: "Jewelry close-up",
    score: 80,
    reason: "Macro + soft light convert tốt; preserveDetail cutout.",
    hashtags: ["#trangsuc", "#jewelry", "#phukien"],
    scenes: ["studio-cream", "soft-girl"],
    hooks: ["Chi tiết lấp lánh — zoom gần xem"],
    platforms: ["tiktok", "instagram"],
    season: "all-year",
  },
];

const DEFAULT_TREND: Omit<(typeof TREND_BANK)[number], "match"> = {
  title: "Try-on local brand",
  score: 75,
  reason: "Try-on digital + watermark brand giúp SME đăng TikTok nhanh.",
  hashtags: ["#localbrand", "#thoitrang", "#tryon", "#fyp"],
  scenes: ["studio-cream", "cafe-pastel", "saigon-rooftop"],
  hooks: ["Upload SP → ghép mẫu → đăng TikTok trong 15 phút"],
  platforms: ["tiktok", "shopee", "instagram"],
  season: "all-year",
};

export function suggestTrendsForProduct(
  query: TrendQuery,
  limit = 4,
): TrendSuggestion[] {
  const hay = [query.productName, query.category, query.kind, query.audience]
    .filter(Boolean)
    .join(" ");

  const scored = TREND_BANK.map((t, i) => {
    const matched = t.match.test(hay) || t.match.test(query.productName);
    let score = matched ? t.score : t.score - 25;
    if (query.colors?.length) score += 2;
    if (query.brand) score += 1;
    return {
      id: `trend_${i}_${slug(t.title)}`,
      title: t.title,
      score: Math.min(99, score),
      reason: t.reason,
      hashtags: t.hashtags,
      scenes: t.scenes,
      hooks: t.hooks.map((h) =>
        h.replace(/SP|sản phẩm/gi, query.productName || "sản phẩm"),
      ),
      platforms: t.platforms,
      season: t.season,
      _matched: matched,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit).map(({ _matched, ...rest }) => rest);

  if (top.length === 0) {
    return [
      {
        id: "trend_default",
        ...DEFAULT_TREND,
        hooks: DEFAULT_TREND.hooks,
      },
    ];
  }

  // Always include a generic fallback if nothing hard-matched
  if (!scored.some((s) => s._matched)) {
    top.push({
      id: "trend_default",
      title: DEFAULT_TREND.title,
      score: DEFAULT_TREND.score,
      reason: DEFAULT_TREND.reason,
      hashtags: DEFAULT_TREND.hashtags,
      scenes: DEFAULT_TREND.scenes,
      hooks: DEFAULT_TREND.hooks,
      platforms: DEFAULT_TREND.platforms,
      season: DEFAULT_TREND.season,
    });
  }

  return top.slice(0, limit);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}
