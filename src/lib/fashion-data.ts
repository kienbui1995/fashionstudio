/** Fashion studio catalog: models, VN scenes, prompt cards, product samples. */

import type { GarmentKind } from "@/lib/image-pipeline";

export type ModelProfile = {
  id: string;
  name: string;
  label: string;
  src: string;
  note?: string;
  heightCm?: number;
  vibe?: string;
  cutout?: boolean;
};

/** Scene for try-on backdrop (photo or solid). */
export type Scene = {
  id: string;
  name: string;
  kind: "photo" | "solid";
  image?: string;
  /** Alias of image for older UI */
  src?: string;
  color?: string;
  group?: "vn" | "genz" | "studio";
  tags?: string[];
};

/** @deprecated use Scene */
export type FashionScene = Scene;

export type PromptCard = {
  id: string;
  title: string;
  description: string;
  sceneId: string;
  garmentHint?: string;
  caption: string;
  tags: string[];
};

export type ProductSample = {
  id: string;
  name: string;
  src: string;
  kind: GarmentKind;
  priceVnd?: number;
  tags: string[];
};

export const MODELS: ModelProfile[] = [
  {
    id: "linh",
    name: "Linh",
    label: "Linh · Soft girl",
    src: "/images/model-linh.jpg",
    note: "Tone da sáng, pose đứng thẳng — fit áo/váy.",
    heightCm: 172,
    vibe: "Soft elegant",
    cutout: true,
  },
  {
    id: "minh",
    name: "Minh",
    label: "Minh · Street",
    src: "/images/model-minh.jpg",
    note: "Look urban, phù hợp top + bag + sneakers.",
    heightCm: 175,
    vibe: "Street strong",
    cutout: true,
  },
  {
    id: "ha",
    name: "Hà",
    label: "Hà · Elegant",
    src: "/images/model-ha.jpg",
    note: "Dáng cao, nền clean — dress & jewelry.",
    heightCm: 168,
    vibe: "Minimal elegant",
    cutout: true,
  },
];

export const VN_SCENES: Scene[] = [
  {
    id: "keep",
    name: "Giữ nền gốc",
    kind: "solid",
    color: "transparent",
    group: "studio",
    tags: ["keep", "original"],
  },
  {
    id: "studio-cream",
    name: "Studio kem",
    kind: "solid",
    color: "#f5efe6",
    group: "studio",
    tags: ["studio", "clean"],
  },
  {
    id: "hanoi-old",
    name: "Phố cổ Hà Nội",
    kind: "photo",
    image: "/images/scene-hanoi-old.jpg",
    src: "/images/scene-hanoi-old.jpg",
    group: "vn",
    tags: ["hanoi", "heritage"],
  },
  {
    id: "saigon-rooftop",
    name: "Rooftop Sài Gòn",
    kind: "photo",
    image: "/images/scene-saigon-rooftop.jpg",
    src: "/images/scene-saigon-rooftop.jpg",
    group: "vn",
    tags: ["saigon", "skyline"],
  },
  {
    id: "danang-beach",
    name: "Biển Đà Nẵng",
    kind: "photo",
    image: "/images/scene-danang-beach.jpg",
    src: "/images/scene-danang-beach.jpg",
    group: "vn",
    tags: ["beach", "summer"],
  },
  {
    id: "cafe-pastel",
    name: "Café pastel",
    kind: "photo",
    image: "/images/scene-cafe-pastel.jpg",
    src: "/images/scene-cafe-pastel.jpg",
    group: "genz",
    tags: ["cafe", "soft"],
  },
  {
    id: "neon-night",
    name: "Neon night",
    kind: "photo",
    image: "/images/scene-neon-night.jpg",
    src: "/images/scene-neon-night.jpg",
    group: "genz",
    tags: ["neon", "night"],
  },
  {
    id: "soft-girl",
    name: "Soft girl blush",
    kind: "solid",
    color: "#f8d7e8",
    group: "genz",
    tags: ["softgirl", "blush"],
  },
];

export const PROMPTS: PromptCard[] = [
  {
    id: "prompt-office-silk",
    title: "Áo lụa đi làm",
    description: "Look công sở nhẹ, nền studio kem + watermark brand.",
    sceneId: "studio-cream",
    garmentHint: "top",
    caption:
      "Áo lụa nữ form vừa — mặc đi làm / coffee date. Inbox size nhé ✨ #aoluanu #localbrand",
    tags: ["áo lụa", "công sở", "local brand"],
  },
  {
    id: "prompt-street-bag",
    title: "Street + bag statement",
    description: "Top basic + túi nổi bật trên rooftop Sài Gòn.",
    sceneId: "saigon-rooftop",
    garmentHint: "bag",
    caption:
      "Túi da mini xinh xỉu — mix street Sài Gòn 🌃 Link giỏ vàng bên dưới #tuixachnu #streetstyle",
    tags: ["túi", "street", "saigon"],
  },
  {
    id: "prompt-beach-linen",
    title: "Linen biển Đà Nẵng",
    description: "Váy/quần linen tone be trên bãi biển.",
    sceneId: "danang-beach",
    garmentHint: "dress",
    caption:
      "Set linen thoáng mát — check-in biển Đà Nẵng 🌊 Free ship nội thành #quanlinen #dulich",
    tags: ["linen", "beach", "đà nẵng"],
  },
  {
    id: "prompt-softgirl-cafe",
    title: "Soft girl café",
    description: "Pastel café Gen Z + dress/accessory.",
    sceneId: "cafe-pastel",
    garmentHint: "dress",
    caption:
      "Váy pastel soft girl đi café — chụp ảnh đẹp khỏi chỉnh 💕 #softgirl #vaynu #genz",
    tags: ["soft girl", "café", "gen z"],
  },
];

export const PRODUCT_SAMPLES: ProductSample[] = [
  {
    id: "ao-so-mi",
    name: "Áo sơ mi linen",
    src: "/images/product-ao-so-mi.jpg",
    kind: "top",
    priceVnd: 389000,
    tags: ["linen", "office"],
  },
  {
    id: "ao-thun",
    name: "Áo thun basic",
    src: "/images/product-ao-thun.jpg",
    kind: "top",
    priceVnd: 199000,
    tags: ["basic", "everyday"],
  },
  {
    id: "vay-midi",
    name: "Váy midi",
    src: "/images/product-vay-midi.jpg",
    kind: "dress",
    priceVnd: 459000,
    tags: ["dress", "date"],
  },
  {
    id: "quan-jean",
    name: "Quần jean",
    src: "/images/product-quan-jean.jpg",
    kind: "bottom",
    priceVnd: 429000,
    tags: ["denim", "street"],
  },
  {
    id: "tui-mini",
    name: "Túi mini",
    src: "/images/product-tui-mini.jpg",
    kind: "bag",
    priceVnd: 329000,
    tags: ["bag", "accessory"],
  },
  {
    id: "giay-sneaker",
    name: "Sneaker trắng",
    src: "/images/product-giay-sneaker.jpg",
    kind: "shoes",
    priceVnd: 599000,
    tags: ["shoes", "sneaker"],
  },
];

export function getModelById(id: string): ModelProfile | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getSceneById(id: string): Scene | undefined {
  return VN_SCENES.find((s) => s.id === id);
}

export function getPromptById(id: string): PromptCard | undefined {
  return PROMPTS.find((p) => p.id === id);
}

export function scenesByGroup(group: NonNullable<Scene["group"]>) {
  return VN_SCENES.filter((s) => s.group === group);
}

export function sceneImageSrc(scene: Scene | undefined | null): string | null {
  if (!scene) return null;
  if (scene.kind === "photo") return scene.image || scene.src || null;
  return null;
}

export function formatVnd(n?: number) {
  if (n == null) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}
