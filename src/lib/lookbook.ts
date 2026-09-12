/** Public lookbook (B4): save an exported look to the server DB and share /l/<id>. */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type LookRow = {
  id: string;
  shop_name: string | null;
  product_name: string | null;
  price_vnd: number | null;
  caption: string | null;
  image_data: string;
  created_at: string | Date;
};

const MAX_IMAGE_CHARS = 2_600_000; // ~1.9 MB binary as data URL

const lookInputSchema = z.object({
  imageData: z.string().min("data:image".length).max(MAX_IMAGE_CHARS),
  productName: z.string().max(160).optional(),
  shopName: z.string().max(160).optional(),
  priceVnd: z.number().int().nonnegative().max(99_999_999_999).nullable(),
  caption: z.string().max(4000).optional(),
});

/** Create a public share — requires a signed-in user (or dev user). */
export const createLook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(lookInputSchema)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const id = `look_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    await sql`
      insert into looks (id, user_id, shop_name, product_name, price_vnd, caption, image_data)
      values (${id}, ${context.userId}, ${data.shopName ?? null}, ${data.productName ?? null}, ${data.priceVnd ?? null}, ${data.caption ?? null}, ${data.imageData})
    `;
    return { id, url: `/l/${id}` };
  });

/** Public read — no auth; the id itself is the capability. */
export const getPublicLook = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<LookRow>`
      select id, shop_name, product_name, price_vnd, caption, image_data, created_at
      from looks where id = ${data.id} limit 1
    `;
    return rows[0] ?? null;
  });

/**
 * Downscale an exported look (PNG data URL) to a shareable JPEG so the DB row
 * stays reasonably sized. Runs in the browser before upload.
 */
export async function toShareableJpeg(dataUrl: string, maxSide = 720): Promise<string> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Không đọc được ảnh look"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}
