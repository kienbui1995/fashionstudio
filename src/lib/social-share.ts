/** Social platform caption builders for fashion looks. */

export type SocialPlatformId =
  | "tiktok"
  | "tiktokshop"
  | "instagram"
  | "facebook"
  | "shopee"
  | "threads";

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  maxCaption: number;
  aspect: string;
  hashtagLimit: number;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "tiktok",
    name: "TikTok",
    maxCaption: 2200,
    aspect: "9:16",
    hashtagLimit: 6,
  },
  {
    id: "tiktokshop",
    name: "TikTok Shop",
    maxCaption: 2200,
    aspect: "9:16",
    hashtagLimit: 5,
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    maxCaption: 2200,
    aspect: "9:16",
    hashtagLimit: 12,
  },
  {
    id: "facebook",
    name: "Facebook",
    maxCaption: 5000,
    aspect: "4:5",
    hashtagLimit: 8,
  },
  {
    id: "shopee",
    name: "Shopee",
    maxCaption: 3000,
    aspect: "1:1",
    hashtagLimit: 0,
  },
  {
    id: "threads",
    name: "Threads",
    maxCaption: 500,
    aspect: "1:1",
    hashtagLimit: 4,
  },
];

export type BuildCaptionInput = {
  platform: SocialPlatformId;
  productName: string;
  brand?: string;
  price?: string;
  scene?: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
  customerName?: string;
};

export function getPlatform(id: SocialPlatformId): SocialPlatform {
  return (
    SOCIAL_PLATFORMS.find((p) => p.id === id) ?? SOCIAL_PLATFORMS[0]!
  );
}

export function buildCaption(input: BuildCaptionInput): string {
  const platform = getPlatform(input.platform);
  const product = input.productName.trim() || "Sản phẩm";
  const brand = input.brand?.trim();
  const price = input.price?.trim();
  const scene = input.scene?.trim();
  const hook =
    input.hook?.trim() ||
    "Form chuẩn, màu xinh — try-on digital từ Fash Studio";
  const cta = input.cta?.trim() || "Inbox size / đặt hàng";
  const tags = (input.hashtags ?? defaultHashtags(input.platform, product)).slice(
    0,
    platform.hashtagLimit || 0,
  );

  let body: string;

  switch (input.platform) {
    case "tiktokshop":
      body = [
        `${product}${brand ? ` | ${brand}` : ""}`,
        hook,
        price ? `Giá ${price} — gắn giỏ vàng 🛒` : "Gắn giỏ vàng để chốt đơn 🛒",
        scene ? `Look: ${scene}` : null,
        cta,
        tags.join(" "),
      ]
        .filter(Boolean)
        .join("\n");
      break;
    case "tiktok":
      body = [
        `${product} — ${hook}`,
        price ? `Giá ${price}` : null,
        scene ? `Scene ${scene}` : null,
        cta,
        tags.join(" "),
      ]
        .filter(Boolean)
        .join("\n");
      break;
    case "instagram":
      body = [
        `${hook}`,
        "",
        `${product}${brand ? ` · ${brand}` : ""}`,
        price ? `💰 ${price}` : null,
        scene ? `📍 ${scene}` : null,
        "",
        cta,
        "",
        tags.join(" "),
      ]
        .filter((l) => l !== null)
        .join("\n");
      break;
    case "facebook":
      body = [
        input.customerName ? `Dành cho ${input.customerName},` : null,
        `${product}${brand ? ` từ ${brand}` : ""}.`,
        hook,
        price ? `Giá: ${price}` : null,
        scene ? `Hình chụp / try-on scene: ${scene}` : null,
        cta,
        tags.join(" "),
      ]
        .filter(Boolean)
        .join("\n");
      break;
    case "shopee":
      body = [
        product,
        brand ? `Thương hiệu: ${brand}` : null,
        price ? `Giá: ${price}` : null,
        hook,
        "Chat để được tư vấn size.",
        "Hình try-on AI — màu thực tế có thể lệch nhẹ theo màn hình.",
      ]
        .filter(Boolean)
        .join("\n");
      break;
    case "threads":
      body = [
        `${product}${price ? ` · ${price}` : ""}`,
        hook,
        tags.join(" "),
      ]
        .filter(Boolean)
        .join("\n");
      break;
    default:
      body = `${product} — ${hook}`;
  }

  if (body.length > platform.maxCaption) {
    return body.slice(0, platform.maxCaption - 1) + "…";
  }
  return body;
}

function defaultHashtags(platform: SocialPlatformId, product: string): string[] {
  const base = [
    "#thoitrang",
    "#localbrand",
    `#${product
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || "fashion"}`,
  ];
  if (platform === "tiktok" || platform === "tiktokshop") {
    return [...base, "#fyp", "#xuhuong", "#tiktokshop"];
  }
  if (platform === "instagram") {
    return [...base, "#ootd", "#fashion", "#reels", "#vietnam", "#style"];
  }
  return base;
}

export function copyCaptionToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard không khả dụng"));
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await copyCaptionToClipboard(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function shareOrCopy(opts: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      });
      return "shared";
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "failed";
  }
  const ok = await copyText([opts.title, opts.text, opts.url].filter(Boolean).join("\n\n"));
  return ok ? "copied" : "failed";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
