/** Export look as short video (Ken Burns) via canvas + MediaRecorder / mp4-muxer. */

import {
  compositeLook,
  loadImage,
  toAbsoluteSrc,
  type CompositeLayer,
  type CompositeOptions,
  type WatermarkOptions,
} from "@/lib/image-pipeline";
import { tiktokSafeCaptionY, TIKTOK_VIDEO_PRESETS, type TikTokVideoPreset } from "@/lib/tiktok-pack";

export type VideoQualityId = "draft" | "standard" | "pro" | "tiktok";
export type VideoQuality = "draft" | "hd" | "max";

export type QualityPreset = {
  id: VideoQualityId;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  videoBitsPerSecond: number;
  mimePreference: string[];
};

export const QUALITY_PRESETS: Record<VideoQualityId, QualityPreset> = {
  draft: {
    id: "draft",
    name: "Draft",
    width: 540,
    height: 960,
    fps: 24,
    durationSec: 6,
    videoBitsPerSecond: 2_500_000,
    mimePreference: [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ],
  },
  standard: {
    id: "standard",
    name: "Standard",
    width: 720,
    height: 1280,
    fps: 30,
    durationSec: 10,
    videoBitsPerSecond: 6_000_000,
    mimePreference: [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    width: 1080,
    height: 1920,
    fps: 30,
    durationSec: 12,
    videoBitsPerSecond: 12_000_000,
    mimePreference: [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/mp4",
      "video/webm",
    ],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok 9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    durationSec: 12,
    videoBitsPerSecond: 10_000_000,
    mimePreference: [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/mp4",
      "video/webm",
    ],
  },
};

export type ReelsPresetId =
  | "reels-9x16"
  | "reels-square"
  | "story-9x16"
  | "feed-4x5";

export type ReelsPreset = {
  id: ReelsPresetId;
  name: string;
  width: number;
  height: number;
  platform: string;
};

export const REELS_PRESETS: ReelsPreset[] = [
  {
    id: "reels-9x16",
    name: "Reels / TikTok 9:16",
    width: 1080,
    height: 1920,
    platform: "tiktok",
  },
  {
    id: "reels-square",
    name: "Feed vuông 1:1",
    width: 1080,
    height: 1080,
    platform: "instagram",
  },
  {
    id: "story-9x16",
    name: "Story 9:16",
    width: 1080,
    height: 1920,
    platform: "instagram",
  },
  {
    id: "feed-4x5",
    name: "Feed 4:5",
    width: 1080,
    height: 1350,
    platform: "instagram",
  },
];

export type KenBurnsMotion =
  | "zoom-in"
  | "zoom-out"
  | "pan-up"
  | "slow-drift";

export type ExportLookVideoOptions = {
  imageSrc: string;
  quality?: VideoQualityId;
  width?: number;
  height?: number;
  fps?: number;
  durationSec?: number;
  motion?: KenBurnsMotion;
  caption?: string;
  brandOverlay?: string;
  onProgress?: (pct: number, label: string) => void;
  preferMp4?: boolean;
  signal?: AbortSignal;
};

/** Composite-then-animate path used by studio UI */
export type VideoExportOptions = {
  modelSrc: string;
  layers: CompositeLayer[];
  backdropImage?: string | null;
  backdropColor?: string | null;
  watermark?: WatermarkOptions | null;
  preset: Pick<TikTokVideoPreset, "id" | "width" | "height" | "durationSec" | "fps" | "motion"> & {
    width: number;
    height: number;
    durationSec: number;
  };
  quality?: VideoQuality;
  onProgress?: (pct: number, msg: string) => void;
};

export type ExportLookVideoResult = {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  durationSec: number;
  fps: number;
  filename: string;
};

function qualityScale(q: VideoQuality) {
  if (q === "draft") return 0.5;
  if (q === "max") return 1;
  return 0.75;
}

function mapVideoQuality(q?: VideoQuality): VideoQualityId {
  if (q === "draft") return "draft";
  if (q === "max") return "pro";
  return "tiktok";
}

function pickMime(preferences: string[]): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  for (const m of preferences) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  return "";
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function kenBurnsTransform(
  motion: KenBurnsMotion,
  t: number,
  w: number,
  h: number,
  imgW: number,
  imgH: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const e = easeInOut(Math.min(1, Math.max(0, t)));
  const cover = Math.max(w / imgW, h / imgH);
  const baseW = imgW * cover;
  const baseH = imgH * cover;

  let scale = 1;
  let panX = 0;
  let panY = 0;

  switch (motion) {
    case "zoom-in":
      scale = 1 + e * 0.18;
      break;
    case "zoom-out":
      scale = 1.18 - e * 0.18;
      break;
    case "pan-up":
      scale = 1.12;
      panY = (0.5 - e) * h * 0.12;
      break;
    case "slow-drift":
    default:
      scale = 1.06 + e * 0.06;
      panX = Math.sin(e * Math.PI) * w * 0.03;
      panY = (e - 0.5) * h * 0.04;
      break;
  }

  const dw = baseW * scale;
  const dh = baseH * scale;
  const dx = (w - dw) / 2 + panX;
  const dy = (h - dh) / 2 + panY;
  return { dx, dy, dw, dh };
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  caption: string,
  brand?: string,
) {
  const y = tiktokSafeCaptionY(height);
  const pad = width * 0.06;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (brand) {
    const fs = Math.max(14, width * 0.028);
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 8;
    ctx.fillText(brand, width / 2, height * 0.08);
  }

  if (caption) {
    const fs = Math.max(16, width * 0.036);
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 10;
    const maxW = width - pad * 2;
    const words = caption.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    const use = lines.slice(0, 3);
    const lineH = fs * 1.25;
    const startY = y - ((use.length - 1) * lineH) / 2;
    use.forEach((ln, i) => {
      ctx.fillText(ln, width / 2, startY + i * lineH);
    });
  }
  ctx.restore();
}

async function animateStillToBlob(opts: {
  imageSrc: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  motion: KenBurnsMotion;
  caption?: string;
  brandOverlay?: string;
  onProgress?: (pct: number, label: string) => void;
  preferMp4?: boolean;
  signal?: AbortSignal;
  videoBitsPerSecond?: number;
}): Promise<{ blob: Blob; mimeType: string }> {
  const {
    imageSrc,
    width,
    height,
    fps,
    durationSec,
    motion,
    caption,
    brandOverlay,
    onProgress,
    preferMp4,
    signal,
    videoBitsPerSecond = 8_000_000,
  } = opts;

  if (preferMp4 !== false) {
    const mp4 = await exportWithMp4Muxer({
      imageSrc,
      width,
      height,
      fps,
      durationSec,
      motion,
      caption,
      brandOverlay,
      onProgress,
      signal,
    });
    if (mp4 && mp4.size > 0) return { blob: mp4, mimeType: "video/mp4" };
  }

  const mimeType = pickMime([
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ]);
  const blob = await exportWithMediaRecorder({
    imageSrc,
    width,
    height,
    fps,
    durationSec,
    motion,
    caption,
    brandOverlay,
    onProgress,
    signal,
    mimeType: mimeType || "video/webm",
    videoBitsPerSecond,
  });
  return { blob, mimeType: blob.type || mimeType || "video/webm" };
}

async function exportWithMediaRecorder(opts: {
  imageSrc: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  motion: KenBurnsMotion;
  caption?: string;
  brandOverlay?: string;
  onProgress?: (pct: number, label: string) => void;
  mimeType: string;
  videoBitsPerSecond: number;
  signal?: AbortSignal;
}): Promise<Blob> {
  const {
    imageSrc,
    width,
    height,
    fps,
    durationSec,
    motion,
    caption,
    brandOverlay,
    onProgress,
    mimeType,
    videoBitsPerSecond,
    signal,
  } = opts;

  const img = await loadImage(toAbsoluteSrc(imageSrc));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D không khả dụng");

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: mimeType || undefined,
    videoBitsPerSecond,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("MediaRecorder lỗi"));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
    };
  });

  recorder.start(100);
  onProgress?.(5, "Bắt đầu quay canvas…");

  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const frameMs = 1000 / fps;

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) {
      recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
      throw new DOMException("Aborted", "AbortError");
    }
    const t = totalFrames <= 1 ? 0 : i / (totalFrames - 1);
    ctx.fillStyle = "#0a0a0b";
    ctx.fillRect(0, 0, width, height);
    const tr = kenBurnsTransform(
      motion,
      t,
      width,
      height,
      img.naturalWidth,
      img.naturalHeight,
    );
    ctx.drawImage(img, tr.dx, tr.dy, tr.dw, tr.dh);
    if (caption || brandOverlay) {
      drawCaption(ctx, width, height, caption || "", brandOverlay);
    }

    const pct = 5 + Math.round((i / totalFrames) * 90);
    if (i % Math.max(1, Math.floor(fps / 2)) === 0) {
      onProgress?.(pct, `Render frame ${i + 1}/${totalFrames}`);
    }

    await new Promise<void>((r) => setTimeout(r, frameMs));
  }

  onProgress?.(96, "Đóng file video…");
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  const blob = await done;
  onProgress?.(100, "Video sẵn sàng");
  return blob;
}

async function exportWithMp4Muxer(opts: {
  imageSrc: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  motion: KenBurnsMotion;
  caption?: string;
  brandOverlay?: string;
  onProgress?: (pct: number, label: string) => void;
  signal?: AbortSignal;
}): Promise<Blob | null> {
  if (
    typeof VideoEncoder === "undefined" ||
    typeof VideoFrame === "undefined"
  ) {
    return null;
  }

  try {
    const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
    const {
      imageSrc,
      width,
      height,
      fps,
      durationSec,
      motion,
      caption,
      brandOverlay,
      onProgress,
      signal,
    } = opts;

    const img = await loadImage(toAbsoluteSrc(imageSrc));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: "avc",
        width,
        height,
        frameRate: fps,
      },
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    });

    const totalFrames = Math.max(1, Math.round(durationSec * fps));
    const frameDuration = 1_000_000 / fps;

    let encoderError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (e) => {
        encoderError = e;
      },
    });

    const config: VideoEncoderConfig = {
      codec: "avc1.42001f",
      width,
      height,
      bitrate: 8_000_000,
      framerate: fps,
      avc: { format: "avc" },
    };

    if (!(await VideoEncoder.isConfigSupported(config)).supported) {
      encoder.close();
      return null;
    }

    encoder.configure(config);
    onProgress?.(8, "Encode MP4 (WebCodecs)…");

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) {
        encoder.close();
        throw new DOMException("Aborted", "AbortError");
      }
      if (encoderError) throw encoderError;

      const t = totalFrames <= 1 ? 0 : i / (totalFrames - 1);
      ctx.fillStyle = "#0a0a0b";
      ctx.fillRect(0, 0, width, height);
      const tr = kenBurnsTransform(
        motion,
        t,
        width,
        height,
        img.naturalWidth,
        img.naturalHeight,
      );
      ctx.drawImage(img, tr.dx, tr.dy, tr.dw, tr.dh);
      if (caption || brandOverlay) {
        drawCaption(ctx, width, height, caption || "", brandOverlay);
      }

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(i * frameDuration),
        duration: Math.round(frameDuration),
      });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      if (i % Math.max(1, Math.floor(fps / 2)) === 0) {
        onProgress?.(
          8 + Math.round((i / totalFrames) * 85),
          `MP4 frame ${i + 1}/${totalFrames}`,
        );
      }
      if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    await encoder.flush();
    encoder.close();
    muxer.finalize();
    onProgress?.(100, "MP4 sẵn sàng");
    return new Blob([target.buffer], { type: "video/mp4" });
  } catch (err) {
    console.warn("[video-export] mp4-muxer path failed", err);
    return null;
  }
}

/** Image-src Ken Burns export (primary API). */
export async function exportLookVideo(
  options: ExportLookVideoOptions,
): Promise<ExportLookVideoResult>;
export async function exportLookVideo(
  options: VideoExportOptions,
): Promise<Blob>;
export async function exportLookVideo(
  options: ExportLookVideoOptions | VideoExportOptions,
): Promise<ExportLookVideoResult | Blob> {
  // Composite path (studio UI)
  if ("modelSrc" in options && "layers" in options && "preset" in options) {
    const blob = await exportLookVideoFromComposite(options);
    return blob;
  }

  const opts = options as ExportLookVideoOptions;
  const quality = QUALITY_PRESETS[opts.quality ?? "standard"];
  const width = opts.width ?? quality.width;
  const height = opts.height ?? quality.height;
  const fps = opts.fps ?? quality.fps;
  const durationSec = opts.durationSec ?? quality.durationSec;
  const motion = opts.motion ?? "zoom-in";

  opts.onProgress?.(2, "Chuẩn bị export video…");

  const { blob, mimeType } = await animateStillToBlob({
    imageSrc: opts.imageSrc,
    width,
    height,
    fps,
    durationSec,
    motion,
    caption: opts.caption,
    brandOverlay: opts.brandOverlay,
    onProgress: opts.onProgress,
    preferMp4: opts.preferMp4,
    signal: opts.signal,
    videoBitsPerSecond: quality.videoBitsPerSecond,
  });

  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  return {
    blob,
    mimeType,
    width,
    height,
    durationSec,
    fps,
    filename: videoFilename({
      ext,
      quality: quality.id,
      width,
      height,
    }),
  };
}

async function exportLookVideoFromComposite(
  opts: VideoExportOptions,
): Promise<Blob> {
  const q = opts.quality || "hd";
  const scale = qualityScale(q);
  const width = Math.round(opts.preset.width * scale) & ~1;
  const height = Math.round(opts.preset.height * scale) & ~1;
  const fps = q === "draft" ? 24 : (opts.preset.fps || 30);
  const durationSec = Math.min(18, Math.max(6, opts.preset.durationSec));
  const motion = (opts.preset.motion || "zoom-in") as KenBurnsMotion;

  opts.onProgress?.(4, "Ghép look…");

  const baseOpts: CompositeOptions = {
    modelSrc: opts.modelSrc,
    modelCutout: Boolean(opts.backdropImage || opts.backdropColor),
    layers: opts.layers,
    width,
    height,
    backdropImage: opts.backdropImage || null,
    backdropColor: opts.backdropColor || null,
    watermark: opts.watermark || null,
    format: "image/png",
    modelAnchorY: 0.56,
    modelHeightRatio: 0.9,
  };

  const still = await compositeLook(baseOpts);
  opts.onProgress?.(12, "Animate Ken Burns…");

  const { blob } = await animateStillToBlob({
    imageSrc: still,
    width,
    height,
    fps,
    durationSec,
    motion,
    caption: "Try-on · Local brand VN",
    onProgress: opts.onProgress,
    preferMp4: true,
    videoBitsPerSecond:
      q === "max" ? 10_000_000 : q === "hd" ? 6_000_000 : 2_500_000,
  });

  return blob;
}

export async function exportAndDownloadVideo(opts: VideoExportOptions) {
  const blob = await exportLookVideoFromComposite(opts);
  const isMp4 = blob.type.includes("mp4");
  const name = `fash-studio-${opts.preset.id}-${Date.now()}.${isMp4 ? "mp4" : "webm"}`;
  downloadBlob(blob, name);
  return { blob, filename: name };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function videoFilename(opts: {
  ext?: string;
  quality?: string;
  width?: number;
  height?: number;
  prefix?: string;
}): string {
  const ext = opts.ext || "webm";
  const q = opts.quality || "export";
  const dim =
    opts.width && opts.height ? `${opts.width}x${opts.height}` : "video";
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${opts.prefix || "fash"}-${q}-${dim}-${ts}.${ext}`;
}

export function formatVideoMeta(
  result: Pick<
    ExportLookVideoResult,
    "width" | "height" | "durationSec" | "fps" | "mimeType"
  > & { size?: number },
): string {
  const mb =
    result.size != null
      ? `${(result.size / (1024 * 1024)).toFixed(2)} MB`
      : "";
  const parts = [
    `${result.width}×${result.height}`,
    `${result.durationSec}s`,
    `${result.fps} fps`,
    result.mimeType,
    mb,
  ].filter(Boolean);
  return parts.join(" · ");
}

export { TIKTOK_VIDEO_PRESETS };
