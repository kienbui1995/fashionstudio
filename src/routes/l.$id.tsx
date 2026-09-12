import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Copy, Heart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/fashion-data";
import { getPublicLook, type LookRow } from "@/lib/lookbook";
import { copyText } from "@/lib/social-share";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/l/$id")({
  // Public page — anyone with the link can view; no auth gate here.
  loader: async ({ params }): Promise<LookRow> => {
    const look = await getPublicLook({ data: { id: params.id } });
    if (!look) throw notFound();
    return look;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return seoHead({ title: "Look", description: "Look từ Fash Studio", path: "/l" });
    }
    return seoHead({
      title: loaderData.product_name
        ? `Look ${loaderData.product_name} · ${loaderData.shop_name ?? "Fash Studio"}`
        : `Look · ${loaderData.shop_name ?? "Fash Studio"}`,
      description:
        loaderData.caption ||
        `Look try-on${loaderData.product_name ? ` ${loaderData.product_name}` : ""} từ ${loaderData.shop_name ?? "local brand"} — tạo bằng Fash Studio.`,
      path: `/l/${loaderData.id}`,
      noindex: true,
    });
  },
  component: LookPublicPage,
});

function LookPublicPage() {
  const look = Route.useLoaderData() as LookRow;
  const price = look.price_vnd !== null ? formatVnd(Number(look.price_vnd)) : null;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link to="/" className="font-display font-semibold">
            Fash Studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <figure className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
          <img
            src={look.image_data}
            alt={look.product_name ?? "Look thời trang"}
            className="w-full object-contain"
          />
          <figcaption className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {look.shop_name && <Badge variant="accent">{look.shop_name}</Badge>}
              {look.product_name && (
                <span className="text-sm font-medium">{look.product_name}</span>
              )}
              {price && <span className="text-sm text-accent">{price}</span>}
            </div>
            {look.caption && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {look.caption}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {look.caption && (
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    void copyText(look.caption!).then((ok) =>
                      ok
                        ? toast.success("Đã sao chép caption")
                        : toast.error("Sao chép lỗi"),
                    )
                  }
                >
                  <Copy className="size-3.5" /> Copy caption
                </Button>
              )}
              <Button size="sm" type="button" onClick={() => toast.success("Nhắn shop qua kênh của shop nhé!")}>
                <Heart className="size-3.5" /> Thích — chốt đơn
              </Button>
            </div>
          </figcaption>
        </figure>

        <aside className="mt-8 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
          <p className="font-medium">Muốn có look như vầy cho shop của bạn?</p>
          <p className="mt-1 text-sm text-fg-muted">
            Fash Studio — try-on, tách nền AI và video TikTok cho local brand Việt.
          </p>
          <Link to="/" className="mt-3 inline-block text-sm text-accent">
            Dùng miễn phí →
          </Link>
        </aside>
      </main>
    </div>
  );
}
