/** Client-only image processing for fashion try-on compositing. */

export type GarmentKind =
  | "top"
  | "bottom"
  | "dress"
  | "bag"
  | "shoes"
  | "jewelry"
  | "accessory"
  | "other";

export type BodyZone = { cx: number; cy: number; scale: number };

const ZONES: Record<GarmentKind, BodyZone> = {
  top: { cx: 0.5, cy: 0.48, scale: 0.55 },
  dress: { cx: 0.5, cy: 0.55, scale: 0.62 },
  bottom: { cx: 0.5, cy: 0.72, scale: 0.45 },
  bag: { cx: 0.58, cy: 0.56, scale: 0.34 },
  shoes: { cx: 0.5, cy: 0.88, scale: 0.34 },
  jewelry: { cx: 0.5, cy: 0.3, scale: 0.22 },
  accessory: { cx: 0.58, cy: 0.48, scale: 0.3 },
  other: { cx: 0.5, cy: 0.52, scale: 0.4 },
};

export function zoneForKind(kind: GarmentKind): BodyZone {
  return ZONES[kind] ?? ZONES.other;
}

export type LayerPlacement = { x: number; y: number; scale: number };

export function fitGarmentInFrame(
  kind: GarmentKind,
  imgW: number,
  imgH: number,
  placement: LayerPlacement,
  opts?: { canvasAspect?: number; margin?: number },
): LayerPlacement {
  const canvasAspect = opts?.canvasAspect ?? 3 / 4;
  const margin = opts?.margin ?? 0.04;
  const imgAspect = imgW > 0 && imgH > 0 ? imgH / imgW : 1;
  let scale = Math.min(0.92, Math.max(0.08, placement.scale));
  const maxH =
    kind === "bag" || kind === "accessory"
      ? 0.48
      : kind === "jewelry" || kind === "shoes"
        ? 0.28
        : 0.7;
  const maxW =
    kind === "bag" || kind === "accessory"
      ? 0.48
      : kind === "jewelry"
        ? 0.32
        : 0.85;
  const hFracForScale1 = imgAspect * canvasAspect;
  if (hFracForScale1 > 0) scale = Math.min(scale, maxH / hFracForScale1, maxW);
  else scale = Math.min(scale, maxW);
  if ((kind === "bag" || kind === "accessory") && scale < 0.2)
    scale = Math.min(maxW, Math.max(scale, 0.22));
  let hFrac = scale * imgAspect * canvasAspect;
  let x = placement.x;
  let y = placement.y;
  const halfW = scale / 2;
  const halfH = hFrac / 2;
  x = Math.min(1 - margin - halfW, Math.max(margin + halfW, x));
  y = Math.min(1 - margin - halfH, Math.max(margin + halfH, y));
  if (halfH * 2 > 1 - margin * 2) {
    hFrac = 1 - margin * 2;
    scale = hFrac / (imgAspect * canvasAspect || 1);
    x = Math.min(1 - margin - scale / 2, Math.max(margin + scale / 2, x));
    y = 0.5;
  }
  return {
    x: Math.round(x * 10000) / 10000,
    y: Math.round(y * 10000) / 10000,
    scale: Math.round(Math.min(maxW, Math.max(0.1, scale)) * 10000) / 10000,
  };
}

export function layerDrawSize(
  kind: GarmentKind | string | undefined,
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number,
  scale: number,
): { targetW: number; targetH: number } {
  const aspect = imgH > 0 && imgW > 0 ? imgH / imgW : 1;
  let targetW = canvasW * scale;
  let targetH = targetW * aspect;
  const isContain =
    kind === "bag" ||
    kind === "accessory" ||
    kind === "jewelry" ||
    kind === "shoes" ||
    kind === "other";
  if (isContain) {
    const maxH =
      kind === "jewelry" || kind === "shoes" ? canvasH * 0.3 : canvasH * 0.5;
    const maxW = canvasW * Math.min(0.5, scale * 1.15);
    if (targetH > maxH) {
      targetH = maxH;
      targetW = targetH / aspect;
    }
    if (targetW > maxW) {
      targetW = maxW;
      targetH = targetW * aspect;
    }
  } else if (targetH > canvasH * 0.92) {
    targetH = canvasH * 0.92;
    targetW = targetH / aspect;
  }
  return { targetW, targetH };
}

const imageCache = new Map<string, HTMLImageElement>();
const imageInflight = new Map<string, Promise<HTMLImageElement>>();

export function clearImageCache() {
  imageCache.clear();
  imageInflight.clear();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const key = src;
  const hit = imageCache.get(key);
  if (hit && hit.complete && hit.naturalWidth > 0) return Promise.resolve(hit);
  const pending = imageInflight.get(key);
  if (pending) return pending;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      imageCache.set(key, img);
      imageInflight.delete(key);
      if (imageCache.size > 48) {
        const first = imageCache.keys().next().value;
        if (first) imageCache.delete(first);
      }
      resolve(img);
    };
    img.onerror = () => {
      imageInflight.delete(key);
      reject(new Error("Không tải được ảnh: " + src.slice(0, 80)));
    };
    img.src = src;
  });
  imageInflight.set(key, p);
  return p;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Đọc file thất bại"));
    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Blob → dataURL thất bại"));
    reader.readAsDataURL(blob);
  });
}

export function toAbsoluteSrc(src: string): string {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (typeof window === "undefined") return src;
  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return src;
  }
}

export async function downscaleDataUrl(
  src: string,
  maxSide = 960,
  mime: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.88,
): Promise<string> {
  const img = await loadImage(toAbsoluteSrc(src));
  const max = Math.max(img.naturalWidth, img.naturalHeight);
  if (max <= maxSide && !src.startsWith("blob:")) {
    if (src.startsWith("data:image/png") && mime === "image/jpeg") {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return src;
      ctx.drawImage(img, 0, 0);
      return c.toDataURL(mime, quality);
    }
    return src;
  }
  const scale = Math.min(1, maxSide / max);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(mime, quality);
}

async function srcToBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) {
    const res = await fetch(src);
    return res.blob();
  }
  const res = await fetch(toAbsoluteSrc(src));
  if (!res.ok) throw new Error("Fetch ảnh thất bại: " + res.status);
  return res.blob();
}

function pixelAt(data: Uint8ClampedArray, w: number, x: number, y: number) {
  const i = (y * w + x) * 4;
  return [data[i]!, data[i + 1]!, data[i + 2]!];
}
function averageColor(samples: number[][]) {
  let r = 0, g = 0, b = 0;
  for (const s of samples) {
    r += s[0]!; g += s[1]!; b += s[2]!;
  }
  const n = samples.length || 1;
  return [r / n, g / n, b / n];
}
function colorDist(a: number[], b: number[]) {
  const dr = a[0]! - b[0]!, dg = a[1]! - b[1]!, db = a[2]! - b[2]!;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
function alphaBounds(data: Uint8ClampedArray, w: number, h: number) {
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 16) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return found ? { minX, minY, maxX, maxY } : null;
}

export async function removeBackgroundFast(src: string): Promise<string> {
  const img = await loadImage(toAbsoluteSrc(src));
  const maxSide = 800;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D không khả dụng");
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const samples: number[][] = [];
  const step = Math.max(1, Math.floor(Math.min(w, h) / 40));
  for (let x = 0; x < w; x += step) {
    samples.push(pixelAt(data, w, x, 0));
    samples.push(pixelAt(data, w, x, h - 1));
  }
  for (let y = 0; y < h; y += step) {
    samples.push(pixelAt(data, w, 0, y));
    samples.push(pixelAt(data, w, w - 1, y));
  }
  const bg = averageColor(samples);
  const hard = 38, soft = 72;
  for (let i = 0; i < data.length; i += 4) {
    const d = colorDist([data[i]!, data[i + 1]!, data[i + 2]!], bg);
    if (d < hard) data[i + 3] = 0;
    else if (d < soft) data[i + 3] = Math.round(((d - hard) / (soft - hard)) * 255);
  }
  ctx.putImageData(imageData, 0, 0);
  const bounds = alphaBounds(data, w, h);
  if (!bounds) return canvas.toDataURL("image/png");
  const pad = 18;
  const sx = Math.max(0, bounds.minX - pad);
  const sy = Math.max(0, bounds.minY - pad);
  const sw = Math.min(w - sx, bounds.maxX - bounds.minX + pad * 2);
  const sh = Math.min(h - sy, bounds.maxY - bounds.minY + pad * 2);
  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas 2D không khả dụng");
  octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL("image/png");
}

type BgModule = typeof import("@imgly/background-removal");
let bgModulePromise: Promise<BgModule> | null = null;
const cutoutCache = new Map<string, string>();

function cutoutKey(src: string) {
  if (src.length < 120) return src;
  return `${src.length}:${src.slice(0, 40)}:${src.slice(-40)}`;
}

export function preloadBgRemoval() {
  if (typeof window === "undefined") return;
  if (!bgModulePromise) bgModulePromise = import("@imgly/background-removal");
}

export async function removeBackgroundSmart(
  src: string,
  onProgress?: (msg: string, pct?: number) => void,
  opts?: { maxSide?: number; preserveDetail?: boolean },
): Promise<string> {
  const key = cutoutKey(src) + (opts?.preserveDetail ? ":hi" : "");
  const cached = cutoutCache.get(key);
  if (cached) {
    onProgress?.("Dùng cutout đã tách…", 100);
    return cached;
  }
  onProgress?.("Chuẩn bị ảnh…", 5);
  const maxSide = opts?.maxSide ?? (opts?.preserveDetail ? 1024 : 768);
  let workSrc = src;
  try {
    workSrc = await downscaleDataUrl(src, maxSide, "image/jpeg", 0.92);
  } catch {
    workSrc = src;
  }
  try {
    if (!bgModulePromise) bgModulePromise = import("@imgly/background-removal");
    onProgress?.("Tải engine tách nền…", 12);
    const mod = await bgModulePromise;
    const blobIn = await srcToBlob(workSrc);
    onProgress?.("Đang tách nền AI…", 28);
    const blob = await mod.removeBackground(blobIn, {
      model: "isnet_quint8",
      output: { format: "image/png", quality: 0.9 },
      progress: (k: string, current: number, total: number) => {
        if (total > 0) {
          const pct = 28 + Math.round((current / total) * 55);
          onProgress?.(`Engine: ${k}`, Math.min(85, pct));
        }
      },
    });
    onProgress?.("Hoàn tất tách nền", 95);
    const out = await blobToDataUrl(blob);
    cutoutCache.set(key, out);
    if (cutoutCache.size > 24) {
      const first = cutoutCache.keys().next().value;
      if (first) cutoutCache.delete(first);
    }
    void loadImage(out);
    return out;
  } catch (err) {
    console.warn("[bg-remove] ML failed, using fast fallback", err);
    onProgress?.("Tách nền nhanh…", 40);
    const out = await removeBackgroundFast(workSrc);
    cutoutCache.set(key, out);
    return out;
  }
}

export type CompositeLayer = {
  imageSrc: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  flipX?: boolean;
  kind?: GarmentKind | string;
};

export type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "tile";

export type WatermarkOptions = {
  enabled: boolean;
  text: string;
  subtext: string;
  logoSrc: string | null;
  position: WatermarkPosition;
  opacity: number;
  logoScale: number;
  fontScale: number;
  color: string;
  tileAngle: number;
  showOnPreview: boolean;
};

export const DEFAULT_WATERMARK: WatermarkOptions = {
  enabled: false,
  text: "Fash Studio",
  subtext: "",
  logoSrc: null,
  position: "bottom-right",
  opacity: 0.55,
  logoScale: 0.14,
  fontScale: 0.032,
  color: "#ffffff",
  tileAngle: -28,
  showOnPreview: true,
};

export type CompositeOptions = {
  modelSrc: string;
  modelCutout?: boolean;
  layers: CompositeLayer[];
  width?: number;
  height?: number;
  backdropColor?: string | null;
  backdropImage?: string | null;
  modelAnchorY?: number;
  modelHeightRatio?: number;
  watermark?: WatermarkOptions | null;
  format?: "image/png" | "image/jpeg";
  quality?: number;
};

function coverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh };
}

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  wm: WatermarkOptions,
) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, wm.opacity));
  ctx.fillStyle = wm.color || "#fff";
  const fontSize = Math.max(12, width * (wm.fontScale || 0.032));
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "bottom";
  const pad = width * 0.04;
  let x = pad, y = height - pad;
  if (wm.position === "bottom-right") {
    ctx.textAlign = "right";
    x = width - pad;
  } else if (wm.position === "top-left") {
    ctx.textAlign = "left";
    y = pad + fontSize;
  } else if (wm.position === "top-right") {
    ctx.textAlign = "right";
    x = width - pad;
    y = pad + fontSize;
  } else if (wm.position === "center") {
    ctx.textAlign = "center";
    x = width / 2;
    y = height / 2;
  } else {
    ctx.textAlign = "left";
  }
  if (wm.position === "tile") {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(((wm.tileAngle || -28) * Math.PI) / 180);
    ctx.globalAlpha = wm.opacity * 0.35;
    ctx.textAlign = "center";
    for (let row = -3; row <= 3; row++) {
      for (let col = -3; col <= 3; col++) {
        ctx.fillText(wm.text || "Brand", col * width * 0.45, row * height * 0.28);
      }
    }
  } else {
    if (wm.logoSrc) {
      try {
        const logo = await loadImage(toAbsoluteSrc(wm.logoSrc));
        const logoW = width * (wm.logoScale || 0.14);
        const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
        let lx = pad, ly = height - pad - logoH;
        if (wm.position.includes("right")) lx = width - pad - logoW;
        if (wm.position.includes("top")) ly = pad;
        if (wm.position === "center") {
          lx = (width - logoW) / 2;
          ly = (height - logoH) / 2 - fontSize;
        }
        ctx.drawImage(logo, lx, ly, logoW, logoH);
        y = ly - 6;
        x = wm.position.includes("right") ? width - pad : pad;
        ctx.textAlign = wm.position.includes("right") ? "right" : "left";
      } catch { /* ignore logo */ }
    }
    if (wm.text) ctx.fillText(wm.text, x, y);
    if (wm.subtext) {
      ctx.font = `400 ${fontSize * 0.7}px system-ui, sans-serif`;
      ctx.globalAlpha = wm.opacity * 0.85;
      ctx.fillText(wm.subtext, x, y + fontSize * 0.85);
    }
  }
  ctx.restore();
}

export async function compositeLook(options: CompositeOptions): Promise<string> {
  const width = options.width ?? 1080;
  const height = options.height ?? 1440;
  const format = options.format ?? "image/png";
  const quality = options.quality ?? 0.92;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D không khả dụng");
  if (format === "image/jpeg") {
    ctx.fillStyle = options.backdropColor || "#0a0a0b";
    ctx.fillRect(0, 0, width, height);
  }
  if (options.backdropImage) {
    const scene = await loadImage(toAbsoluteSrc(options.backdropImage));
    const cover = coverRect(scene.naturalWidth, scene.naturalHeight, width, height);
    ctx.drawImage(scene, cover.dx, cover.dy, cover.dw, cover.dh);
  } else if (options.backdropColor) {
    ctx.fillStyle = options.backdropColor;
    ctx.fillRect(0, 0, width, height);
  }
  const model = await loadImage(toAbsoluteSrc(options.modelSrc));
  if (options.modelCutout || options.backdropImage) {
    const ratio = options.modelHeightRatio ?? 0.88;
    const targetH = height * ratio;
    const aspect = model.naturalWidth / model.naturalHeight;
    const targetW = targetH * aspect;
    const cx = width / 2;
    const cy = height * (options.modelAnchorY ?? 0.58);
    ctx.drawImage(model, cx - targetW / 2, cy - targetH / 2, targetW, targetH);
  } else {
    const cover = coverRect(model.naturalWidth, model.naturalHeight, width, height);
    ctx.drawImage(model, cover.dx, cover.dy, cover.dw, cover.dh);
  }
  const layerImgs = await Promise.all(
    options.layers.map((layer) => loadImage(toAbsoluteSrc(layer.imageSrc))),
  );
  options.layers.forEach((layer, i) => {
    const gImg = layerImgs[i]!;
    const { targetW, targetH } = layerDrawSize(
      layer.kind, gImg.naturalWidth, gImg.naturalHeight, width, height, layer.scale,
    );
    const halfW = targetW / 2 / width;
    const halfH = targetH / 2 / height;
    const nx = Math.min(1 - 0.02 - halfW, Math.max(0.02 + halfW, layer.x));
    const ny = Math.min(1 - 0.02 - halfH, Math.max(0.02 + halfH, layer.y));
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, layer.opacity));
    ctx.translate(nx * width, ny * height);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    if (layer.flipX) ctx.scale(-1, 1);
    ctx.drawImage(gImg, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();
  });
  if (options.watermark?.enabled) {
    await drawWatermark(ctx, width, height, options.watermark);
  }
  if (format === "image/jpeg") return canvas.toDataURL("image/jpeg", quality);
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
