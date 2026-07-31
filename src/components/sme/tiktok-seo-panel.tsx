import { useMemo, useState } from "react";
import { Check, Copy, Hash, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildTikTokSeo } from "@/lib/tiktok-seo";
import { copyText } from "@/lib/social-share";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  brand?: string;
  scene?: string;
  price?: string;
  category?: string;
  className?: string;
  compact?: boolean;
};

export function TikTokSeoPanel({
  productName,
  brand,
  scene,
  price,
  category,
  className,
  compact = true,
}: Props) {
  const [keywords, setKeywords] = useState("local brand, outfit, tiktok shop");

  const pack = useMemo(
    () =>
      buildTikTokSeo({
        productName,
        brand,
        scene,
        price,
        category,
        extraKeywords: keywords
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    [productName, brand, scene, price, category, keywords],
  );

  async function copy(label: string, text: string) {
    const ok = await copyText(text);
    if (ok) toast.success(`Đã copy ${label}`);
    else toast.error("Không sao chép được");
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-bg-elevated",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Hash className="size-4 text-accent" />
          <h3 className="text-sm font-medium">TikTok SEO</h3>
        </div>
        <Badge variant="accent">Điểm {pack.score}</Badge>
      </div>

      {!compact && (
        <label className="mt-3 block text-xs text-fg-muted">
          Từ khóa thêm
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-bg px-2 py-1.5 text-sm"
          />
        </label>
      )}

      <p className="mt-3 text-xs font-medium text-fg-muted">Từ khóa chính</p>
      <p className="mt-1 text-sm font-medium text-accent">{pack.primaryKeyword}</p>

      <p className="mt-3 text-xs font-medium text-fg-muted">Caption</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-snug text-fg-muted">
        {compact ? pack.caption.slice(0, 160) + (pack.caption.length > 160 ? "…" : "") : pack.caption}
      </p>

      <p className="mt-3 text-xs font-medium text-fg-muted">Hook / on-screen</p>
      <ul className="mt-1 space-y-1 text-xs text-fg-muted">
        <li>· {pack.voiceHook}</li>
        <li>· On-screen: {pack.onScreenText}</li>
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {pack.hashtags.slice(0, compact ? 6 : 12).map((t) => (
          <Badge key={t} variant="outline">
            {t}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={() => void copy("caption", pack.caption)}
        >
          <Copy className="size-3.5" /> Caption
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => void copy("hashtags", pack.hashtags.join(" "))}
        >
          <Sparkles className="size-3.5" /> Tags
        </Button>
      </div>

      {!compact && pack.tips.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
          {pack.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-fg-muted">
              <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
