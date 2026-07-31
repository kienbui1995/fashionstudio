/** TikTok video specs, Shop listing helpers, safe caption zone. */

export const TIKTOK_VIDEO_SPEC = {
  aspectRatio: "9:16" as const,
  width: 1080,
  height: 1920,
  minDuration: 5,
  maxDuration: 60,
  idealDuration: 12,
  fps: 30,
  bottomUiCover: 0.22,
  topSafe: 0.12,
  maxCaptionChars: 2200,
  maxHashtags: 6,
  preferredCodec: "h264" as const,
};

export type TikTokVideoPresetId =
  | "shop-hook"
  | "lookbook"
  | "ugc-tryon"
  | "flash-sale";

export type TikTokVideoPreset = {
  id: TikTokVideoPresetId;
  name: string;
  description: string;
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  motion: "zoom-in" | "zoom-out" | "pan-up" | "slow-drift";
  captionTemplate: string;
};

export const TIKTOK_VIDEO_PRESETS: TikTokVideoPreset[] = [
  {
    id: "shop-hook",
    name: "Shop hook 3s",
    description: "Hook sản phẩm 3s đầu, CTA giỏ vàng, 12s tổng.",
    durationSec: 12,
    width: 1080,
    height: 1920,
    fps: 30,
    motion: "zoom-in",
    captionTemplate:
      "{product} — {hook}\nGiá {price} · Inbox / giỏ vàng 🛒\n{hashtags}",
  },
  {
    id: "lookbook",
    name: "Lookbook chậm",
    description: "Ken Burns chậm, vibe editorial, 15s.",
    durationSec: 15,
    width: 1080,
    height: 1920,
    fps: 30,
    motion: "slow-drift",
    captionTemplate:
      "Look {product} · scene {scene}\nLocal brand Việt ✨\n{hashtags}",
  },
  {
    id: "ugc-tryon",
    name: "UGC try-on",
    description: "Cảm giác khách thử đồ, zoom nhẹ, 10s.",
    durationSec: 10,
    width: 1080,
    height: 1920,
    fps: 30,
    motion: "zoom-out",
    captionTemplate:
      "Thử {product} real-life 👀\nSize gợi ý ở comment · {cta}\n{hashtags}",
  },
  {
    id: "flash-sale",
    name: "Flash sale",
    description: "Nhịp nhanh, pan-up, 8s chốt đơn.",
    durationSec: 8,
    width: 1080,
    height: 1920,
    fps: 30,
    motion: "pan-up",
    captionTemplate:
      "⚡ FLASH {product} — {price}\nChỉ hôm nay · {cta}\n{hashtags}",
  },
];

export type TikTokShopListing = {
  title: string;
  description: string;
  bullets: string[];
  hashtags: string[];
  categoryHint: string;
  priceNote: string;
  skuHint: string;
};

export function buildTikTokShopListing(input: {
  productName: string;
  brand?: string;
  price?: string;
  material?: string;
  colors?: string[];
  sizes?: string[];
  scene?: string;
}): TikTokShopListing {
  const brand = input.brand?.trim() || "Local brand";
  const product = input.productName.trim() || "Sản phẩm thời trang";
  const price = input.price?.trim() || "Liên hệ";
  const material = input.material?.trim() || "Vải cao cấp";
  const colors = input.colors?.length ? input.colors.join(", ") : "Nhiều màu";
  const sizes = input.sizes?.length ? input.sizes.join(", ") : "S–XL";
  const scene = input.scene?.trim() || "studio";

  const title = `${product} | ${brand} | Free ship nội thành`.slice(0, 120);
  const description = [
    `${product} từ ${brand}.`,
    `Chất liệu: ${material}. Màu: ${colors}. Size: ${sizes}.`,
    `Hình try-on digital scene ${scene} — màu thật có thể lệch 5–10% màn hình.`,
    `Giá: ${price}. Đổi size trong 3 ngày (còn tag, chưa giặt).`,
  ].join(" ");

  return {
    title,
    description,
    bullets: [
      `Chất liệu: ${material}`,
      `Màu sắc: ${colors}`,
      `Size: ${sizes}`,
      `Giá: ${price}`,
      "Hình try-on AI — xem form trước khi mua",
    ],
    hashtags: [
      "#tiktokshop",
      "#thoitrangnu",
      "#localbrand",
      `#${slugTag(product)}`,
      "#xuhuong",
    ].slice(0, TIKTOK_VIDEO_SPEC.maxHashtags),
    categoryHint: "Thời trang nữ / Phụ kiện",
    priceNote: price,
    skuHint: `${slugTag(brand)}-${slugTag(product)}`.slice(0, 32).toUpperCase(),
  };
}

export function buildTikTokCaption(input: {
  productName: string;
  hook?: string;
  price?: string;
  cta?: string;
  hashtags?: string[];
  scene?: string;
  presetId?: TikTokVideoPresetId;
}): string {
  const product = input.productName.trim() || "Sản phẩm";
  const hook =
    input.hook?.trim() ||
    "Form chuẩn, màu xinh, mặc là auto có ảnh đăng";
  const price = input.price?.trim() || "";
  const cta = input.cta?.trim() || "Bấm giỏ vàng / inbox size";
  const scene = input.scene?.trim() || "";
  const tags = input.hashtags?.length
    ? input.hashtags
    : ["#fyp", "#thoitrang", "#localbrand", `#${slugTag(product)}`];

  const preset = TIKTOK_VIDEO_PRESETS.find((p) => p.id === input.presetId);
  if (preset) {
    return preset.captionTemplate
      .replace(/\{product\}/g, product)
      .replace(/\{hook\}/g, hook)
      .replace(/\{price\}/g, price || "inbox")
      .replace(/\{cta\}/g, cta)
      .replace(/\{scene\}/g, scene || "studio")
      .replace(/\{hashtags\}/g, tags.slice(0, 6).join(" "));
  }

  const lines = [
    `${product} — ${hook}`,
    price ? `Giá ${price}` : null,
    scene ? `Scene: ${scene}` : null,
    cta,
    tags.slice(0, 6).join(" "),
  ].filter(Boolean) as string[];

  return lines.join("\n").slice(0, TIKTOK_VIDEO_SPEC.maxCaptionChars);
}

export const TIKTOK_SHOP_CHECKLIST: {
  id: string;
  label: string;
  tip: string;
}[] = [
  {
    id: "hook3",
    label: "Hook sản phẩm trong 3 giây đầu",
    tip: "Zoom vào chi tiết vải/logo ngay frame 1.",
  },
  {
    id: "safezone",
    label: "Text trong safe-zone caption",
    tip: "Tránh 22% đáy màn hình (UI TikTok).",
  },
  {
    id: "keyword",
    label: "Primary keyword dòng 1 caption",
    tip: 'VD: áo lụa nữ, quần linen ống rộng.',
  },
  {
    id: "cart",
    label: "Gắn giỏ / product card",
    tip: "Listing title khớp caption + thumbnail.",
  },
  {
    id: "size",
    label: "Gợi ý size / bảng size",
    tip: "Comment ghim hoặc on-screen nhẹ.",
  },
  {
    id: "hashtag",
    label: "4–6 hashtag (không spam)",
    tip: "2 ngách + 1–2 broad + 1 brand.",
  },
  {
    id: "audio",
    label: "Nhạc trending / original",
    tip: "Tránh nhạc copyright lạ khi ads.",
  },
  {
    id: "export",
    label: "Xuất 1080×1920 H.264",
    tip: "MP4 hoặc WebM 9:16 từ studio.",
  },
];

/** Y position (px from top) for safe on-screen caption text. */
export function tiktokSafeCaptionY(height: number): number {
  return Math.round(height * 0.78);
}

export function tiktokSafeTitleY(height: number): number {
  return Math.round(height * TIKTOK_VIDEO_SPEC.topSafe);
}

function slugTag(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "fashion"
  );
}


/** UI alias for video presets */
export type TikTokPreset = {
  id: string;
  label: string;
  aspect: "9:16" | "1:1" | "4:5";
  width: number;
  height: number;
  durationSec: number;
  fps?: number;
  motion?: "zoom-in" | "zoom-out" | "pan-up" | "slow-drift";
  hooks: string[];
  safeZone: { top: number; bottom: number; left: number; right: number };
};

export const TIKTOK_PRESETS: TikTokPreset[] = TIKTOK_VIDEO_PRESETS.map((p) => ({
  id: p.id,
  label: p.name,
  aspect: "9:16" as const,
  width: p.width,
  height: p.height,
  durationSec: p.durationSec,
  fps: p.fps,
  motion: p.motion,
  hooks: [p.description],
  safeZone: { top: 0.12, bottom: 0.22, left: 0.06, right: 0.18 },
}));

export type TikTokSeoInput = {
  productName: string;
  brand?: string;
  scene?: string;
  vibe?: string;
  priceVnd?: number;
  keywords?: string[];
  hashtags?: string[];
  cta?: string;
};

export type TikTokSeoPack = {
  title: string;
  caption: string;
  hashtags: string[];
  hookLines: string[];
  listingBullets: string[];
  seoScore: number;
  checklist: { id: string; label: string; done: boolean }[];
};

/** Compat pack builder used by TikTokSeoPanel (also see tiktok-seo.ts). */
export function buildTikTokSeo(input: TikTokSeoInput): TikTokSeoPack {
  const brand = (input.brand || "Local brand").trim();
  const product = (input.productName || "Sản phẩm mới").trim();
  const scene = input.scene || "studio";
  const vibe = input.vibe || "minimal";
  const price =
    input.priceVnd != null
      ? new Intl.NumberFormat("vi-VN").format(input.priceVnd) + "đ"
      : null;

  const extra = (input.keywords || [])
    .map((k) => k.replace(/^#/, "").trim())
    .filter(Boolean);
  const tags = Array.from(
    new Set([
      "localbrand",
      "thoitrangnu",
      "outfitcheck",
      "tiktokshop",
      "fashionvn",
      "ootd",
      ...extra,
      ...(input.hashtags || []).map((h) => h.replace(/^#/, "")),
      brand.toLowerCase().replace(/\s+/g, ""),
    ]),
  ).slice(0, 12);

  const title = `${product} | ${brand} — look ${vibe} ${scene}`.slice(0, 90);
  const caption = [
    `✨ ${product} — ${brand}`,
    price ? `💸 Chỉ ${price}` : "💸 Giá local brand thân thiện",
    `📍 Cảnh: ${scene} · vibe ${vibe}`,
    "",
    "Try-on digital + video 9:16 sẵn đăng TikTok Shop.",
    input.cta || "👇 Comment SIZE · chạm giỏ để đặt",
    "",
    tags.map((t) => `#${t}`).join(" "),
  ].join("\n");

  const hookLines = [
    `Đừng scroll — ${product} này đang trending local brand`,
    `POV: mix ${product} với scene ${scene}`,
    price
      ? `${price} thôi mà nhìn như lookbook 2 triệu`
      : `Look đắt giá với ngân sách local brand`,
  ];

  const listingBullets = [
    `Tên: ${product}`,
    `Brand: ${brand}`,
    price ? `Giá gợi ý: ${price}` : "Giá: cập nhật trên Shop",
    `Chất liệu/vibe: ${vibe}`,
    "Size: S–XL (điền bảng size)",
    "Giao toàn quốc · đổi size 7 ngày",
  ];

  let seoScore = 42;
  if (product.length >= 8) seoScore += 12;
  if (brand.length >= 3) seoScore += 8;
  if (price) seoScore += 10;
  if (tags.length >= 8) seoScore += 12;
  if (extra.length) seoScore += 8;
  if ((input.cta || "").length > 5) seoScore += 8;
  seoScore = Math.min(98, seoScore);

  const checklist = [
    { id: "hook", label: "Hook 3 giây rõ sản phẩm", done: true },
    { id: "safe", label: "Safe-zone text (không che UI TikTok)", done: true },
    { id: "price", label: "Hiện giá / ưu đãi", done: Boolean(price) },
    {
      id: "cta",
      label: "CTA giỏ hàng / comment size",
      done: Boolean(input.cta || true),
    },
    { id: "tags", label: "Hashtag mix broad + niche", done: tags.length >= 6 },
    { id: "watermark", label: "Watermark brand (tuỳ chọn)", done: false },
  ];

  return {
    title,
    caption,
    hashtags: tags,
    hookLines,
    listingBullets,
    seoScore,
    checklist,
  };
}
