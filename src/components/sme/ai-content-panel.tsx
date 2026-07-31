import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AI_KIND_OPTIONS,
  AI_TONE_OPTIONS,
  generateWithEngine,
  type AiContentKind,
  type AiTone,
  type GenerateResult,
} from "@/lib/ai-content";
import { copyText } from "@/lib/social-share";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  brand?: string;
  scene?: string;
  price?: string;
  className?: string;
};

export function AiContentPanel({
  productName,
  brand,
  scene,
  price,
  className,
}: Props) {
  const [kind, setKind] = useState<AiContentKind>("caption");
  const [tone, setTone] = useState<AiTone>("genz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function run() {
    setLoading(true);
    try {
      const out = await generateWithEngine({
        kind,
        tone,
        productName,
        brand,
        scene,
        price,
        engine: "local-rules",
      });
      setResult(out);
      toast.success("Đã tạo nội dung AI");
    } catch (e) {
      toast.error((e as Error).message || "Tạo nội dung lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Wand2 className="size-4 text-accent" />
        <h3 className="font-medium">AI Content</h3>
        <Badge variant="outline">generateWithEngine</Badge>
      </div>
      <p className="mt-1 text-xs text-fg-muted">
        Caption, hook, SEO và listing — chạy client-side, không gọi API ngoài.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {AI_KIND_OPTIONS.map((k) => (
          <button
            key={k.id}
            type="button"
            title={k.hint}
            onClick={() => setKind(k.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              kind === k.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-fg-muted hover:bg-bg-subtle",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {AI_TONE_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTone(t.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              tone === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-fg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Button className="mt-4 w-full" type="button" onClick={() => void run()} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Tạo nội dung
      </Button>

      {result && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{result.title}</p>
            <Badge variant="outline">{result.engine}</Badge>
          </div>
          <button
            type="button"
            className="w-full whitespace-pre-wrap rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 text-left text-sm leading-relaxed hover:border-accent"
            onClick={() =>
              void copyText(result.body).then((ok) =>
                ok ? toast.success("Đã sao chép") : toast.error("Sao chép lỗi"),
              )
            }
          >
            {result.body}
          </button>
          {result.meta && (
            <p className="text-[11px] text-fg-subtle">
              {typeof result.meta.score === "number" && `Điểm ${result.meta.score} · `}
              Click body để copy
            </p>
          )}
        </div>
      )}
    </div>
  );
}
