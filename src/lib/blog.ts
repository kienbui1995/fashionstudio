export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "try-on-local-brand-viet-nam",
    title: "Try-on thời trang cho local brand Việt: quy trình 15 phút",
    description:
      "Cách local brand dùng try-on AI để làm lookbook, video TikTok và listing Shopee mà không cần studio lớn.",
    date: "2026-07-20",
    keywords: ["try-on local brand", "lookbook việt nam", "studio thời trang"],
    body: [
      "Local brand Việt thường kẹt ở khâu ảnh: thuê mẫu đắt, bối cảnh hạn chế, đăng TikTok chậm.",
      "Try-on digital giúp upload sản phẩm, ghép mẫu và cảnh (phố cổ, café Gen Z, rooftop Sài Gòn) trong vài phút.",
      "Quy trình gợi ý: (1) chụp SP phẳng nền sạch, (2) tách nền, (3) chọn mẫu + cảnh, (4) watermark brand, (5) xuất PNG + MP4 9:16.",
      "Fash Studio gom các bước này thành một workspace cho SME và xưởng may nhỏ.",
    ],
  },
  {
    slug: "tiktok-shop-video-thoi-trang",
    title: "Làm video TikTok Shop thời trang 9:16 chuẩn chốt đơn",
    description:
      "Hook 3 giây, safe-zone caption, gắn giỏ và checklist đăng bán cho shop thời trang trên TikTok.",
    date: "2026-07-25",
    keywords: ["tiktok shop", "video thời trang", "reels 9:16"],
    body: [
      "TikTok Shop ưu tiên video dọc 9:16, hook rõ sản phẩm trong 3 giây đầu.",
      "Caption nên front-load từ khóa tìm kiếm (ví dụ “áo lụa nữ”) và CTA giỏ vàng.",
      "Tránh text sát mép dưới — UI TikTok che khoảng 20% đáy màn hình.",
      "Xuất MP4 H.264 1080×1920 từ studio, kèm pack listing để đăng nhanh hơn Excel + CapCut rời rạc.",
    ],
  },
  {
    slug: "seo-tiktok-organic-thoi-trang",
    title: "SEO TikTok organic cho shop thời trang: keyword & hashtag",
    description:
      "Primary keyword, on-screen text, voice hook và hashtag 4–6 tag cho FYP + Search TikTok.",
    date: "2026-07-28",
    keywords: ["seo tiktok", "hashtag thời trang", "fyp fashion"],
    body: [
      "TikTok Search đọc caption, chữ trên video và lời thoại — không chỉ hashtag.",
      "Mỗi video nên có 1 primary keyword (vd: quần linen nữ), xuất hiện dòng 1 caption + on-screen.",
      "Hashtag: 2–3 ngách + 1–2 broad (#fyp, #xuhuong) + 1 brand — tránh spam 15 tag.",
      "Đăng khung giờ 11–13h và 18–22h (VN), đo Traffic source trong Analytics.",
    ],
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
