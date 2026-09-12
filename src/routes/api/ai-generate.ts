import { createFileRoute } from "@tanstack/react-router";
import type { AiContentKind } from "@/lib/ai-content";

/**
 * POST /api/ai-generate — real AI content via any OpenAI-compatible API
 * (Z.ai/GLM, Gemini OpenAI-compat, OpenAI, self-hosted gateways…).
 *
 * Configure in host env or `.env.local`:
 *   AI_API_KEY   — API key (required to enable)
 *   AI_API_BASE  — default https://api.z.ai/api/paas/v4
 *   AI_MODEL     — default glm-4.6
 *
 * Never errors hard: returns { ok:false, reason } so the client can fall
 * back to the offline template engine.
 */

type AiGenerateBody = {
  kind?: string;
  tone?: string;
  kindLabel?: string;
  toneLabel?: string;
  productName?: string;
  brand?: string;
  price?: string;
  scene?: string;
  category?: string;
  audience?: string;
  extra?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

let envLocalCache: Record<string, string> | null = null;
let envLocalPromise: Promise<Record<string, string>> | null = null;

async function readEnvLocal(): Promise<Record<string, string>> {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const raw = fs.readFileSync(
      path.resolve(process.cwd(), ".env.local"),
      "utf8",
    );
    const out: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = (m[2] ?? "").replace(/^["']|["']$/g, "").trim();
      if (value) out[m[1]!] = value;
    }
    return out;
  } catch {
    return {};
  }
}

async function env(k: string): Promise<string | undefined> {
  const fromProcess = process.env[k]?.trim();
  if (fromProcess) return fromProcess;
  if (!envLocalCache) {
    envLocalPromise ??= readEnvLocal();
    envLocalCache = await envLocalPromise;
  }
  return envLocalCache[k];
}

type AiConfig = { key: string; base: string; model: string };

async function aiConfig(): Promise<AiConfig | null> {
  const key = await env("AI_API_KEY");
  if (!key) return null;
  return {
    key,
    base: ((await env("AI_API_BASE")) || "https://api.z.ai/api/paas/v4").replace(
      /\/$/,
      "",
    ),
    model: (await env("AI_MODEL")) || "glm-4.6",
  };
}

function buildPrompt(body: AiGenerateBody) {
  const lines = [
    `Sản phẩm: ${body.productName?.trim() || "sản phẩm thời trang"}`,
    body.brand && `Brand/gian hàng: ${body.brand}`,
    body.category && `Danh mục: ${body.category}`,
    body.price && `Giá (bắt buộc dùng đúng): ${body.price}`,
    body.scene && `Cảnh/context: ${body.scene}`,
    body.audience && `Khách mục tiêu: ${body.audience}`,
    body.extra && `Yêu cầu thêm: ${body.extra}`,
    `Loại nội dung: ${body.kindLabel || body.kind || "caption"}`,
    `Tone: ${body.toneLabel || body.tone || "friendly"}`,
  ].filter(Boolean);

  return [
    ...lines,
    "",
    "Viết tiếng Việt tự nhiên (không dịch máy), đúng tone, không bịa thông tin không có trong đề bài.",
    'Trả về đúng format, không thêm giải thích:',
    "Dòng 1: TITLE: <tiêu đề ngắn gọn>",
    "Từ dòng 2 trở đi: nội dung chính. Nếu loại nội dung là caption/hashtag thì kèm 4–6 hashtag ở cuối.",
  ].join("\n");
}

const SYSTEM_PROMPT = [
  "Bạn là copywriter thời trang Việt Nam nhiều năm cho local brand / shop TikTok & Shopee.",
  "Bạn viết caption, hook video, listing sản phẩm — ngắn gọn, có nhịp, đúng tone người Việt trẻ.",
  "Luôn dùng đúng giá và tên sản phẩm được cung cấp, không bịa khuyến mãi.",
].join(" ");

async function callAi(cfg: AiConfig, body: AiGenerateBody) {
  const res = await fetch(`${cfg.base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(body) },
      ],
      temperature: 0.9,
      max_tokens: 700,
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    return { ok: false as const, reason: `ai-http-${res.status}` };
  }
  const data = (await res.json()) as ChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false as const, reason: "ai-empty" };

  const titleMatch = text.match(/^TITLE:\s*(.+)$/im);
  const title = titleMatch?.[1]?.trim() || "Nội dung AI";
  const content = titleMatch ? text.replace(titleMatch[0], "").trim() : text;
  return { ok: true as const, title, body: content, model: cfg.model };
}

export const Route = createFileRoute("/api/ai-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: AiGenerateBody;
        try {
          body = (await request.json()) as AiGenerateBody;
        } catch {
          return Response.json({ ok: false, reason: "bad-json" }, { status: 400 });
        }
        if (!body?.productName || typeof body.productName !== "string") {
          return Response.json({ ok: false, reason: "no-product" }, { status: 400 });
        }
        if (body.kind && !isValidKind(body.kind)) {
          return Response.json({ ok: false, reason: "bad-kind" }, { status: 400 });
        }

        const cfg = await aiConfig();
        if (!cfg) {
          return Response.json({ ok: false, reason: "no-key" });
        }
        try {
          const result = await callAi(cfg, body);
          return Response.json(result);
        } catch (e) {
          return Response.json({
            ok: false,
            reason: "ai-error",
            message: (e as Error).message?.slice(0, 200),
          });
        }
      },
    },
  },
});

function isValidKind(kind: string): kind is AiContentKind {
  return [
    "caption",
    "tiktok_seo",
    "tiktok_shop",
    "full_post",
    "hook",
    "hashtags",
    "product_title",
    "email_blast",
  ].includes(kind);
}
