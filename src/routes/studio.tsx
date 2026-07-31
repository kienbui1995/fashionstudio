import { useCallback, useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clapperboard,
  Download,
  ImagePlus,
  Layers,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Video,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { AiContentPanel } from "@/components/sme/ai-content-panel";
import { TikTokSeoPanel } from "@/components/sme/tiktok-seo-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MODELS,
  PRODUCT_SAMPLES,
  PROMPTS,
  VN_SCENES,
  formatVnd,
  type Scene,
} from "@/lib/fashion-data";
import { useCustomerLibrary } from "@/lib/customer-library";
import {
  fileToDataUrl,
  layerDrawSize,
  type GarmentKind,
} from "@/lib/image-pipeline";
import { shareOrCopy } from "@/lib/social-share";
import {
  useStudioStore,
  type GarmentLayer,
  type StudioTab,
} from "@/lib/studio-store";
import {
  TIKTOK_SHOP_CHECKLIST,
  TIKTOK_VIDEO_PRESETS,
  type TikTokVideoPresetId,
} from "@/lib/tiktok-pack";
import {
  QUALITY_PRESETS,
  downloadBlob,
  exportLookVideo,
  type VideoQualityId,
} from "@/lib/video-export";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  head: () =>
    seoHead({
      title: "Studio thử đồ & video TikTok",
      description:
        "Mở studio thử đồ: tải sản phẩm, ghép mẫu, xuất ảnh PNG và video TikTok 9:16 cho local brand Việt.",
      path: "/studio",
      keywords: ["studio thử đồ", "tạo video tiktok thời trang"],
    }),
  component: StudioPage,
});


const KIND_LABELS: Record<string, string> = {
  top: "Áo",
  bottom: "Quần",
  dress: "Đầm",
  bag: "Túi",
  shoes: "Giày",
  jewelry: "Trang sức",
  accessory: "Phụ kiện",
  other: "Khác",
};

const TABS: { id: StudioTab; label: string; icon: typeof Sparkles }[] = [
  { id: "create", label: "Thử đồ", icon: Sparkles },
  { id: "gallery", label: "Thư viện", icon: ImagePlus },
  { id: "prompts", label: "AI nội dung", icon: Wand2 },
  { id: "video", label: "Video", icon: Video },
  { id: "clients", label: "Khách hàng", icon: Users },
];

function StudioPage() {
  const activeTab = useStudioStore((s) => s.activeTab);
  const setActiveTab = useStudioStore((s) => s.setActiveTab);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg/90 px-3 backdrop-blur sm:px-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </Button>
          <span className="font-display text-sm font-medium sm:text-base">
            Studio thử đồ
          </span>
          <Badge variant="accent" className="hidden sm:inline-flex">
            Fash
          </Badge>
        </div>
        <nav
          className="flex max-w-[55vw] items-center gap-0.5 overflow-x-auto sm:max-w-none"
          aria-label="Tab studio"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-md)] px-2 py-1.5 text-xs sm:px-3 sm:text-sm",
                activeTab === t.id
                  ? "bg-accent/15 text-accent"
                  : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
              )}
            >
              <t.icon className="size-3.5" />
              <span className="hidden md:inline">{t.label}</span>
              <span className="md:hidden">{t.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard">Bảng điều khiển</Link>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {activeTab === "create" && <CreateWorkspace />}
        {activeTab === "gallery" && <GalleryPanel />}
        {activeTab === "prompts" && <PromptsAiTab />}
        {activeTab === "video" && <VideoPanel />}
        {activeTab === "clients" && <ClientsPanel />}
      </div>
    </div>
  );
}

function CreateWorkspace() {
  return (
    <>
      <aside className="w-full shrink-0 overflow-y-auto border-b border-border lg:h-[calc(100dvh-3.5rem)] lg:w-80 lg:border-b-0 lg:border-r xl:w-96">
        <StudioSidebar />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto p-3 sm:p-6">
        <CreateCanvas />
      </main>
    </>
  );
}

function StudioSidebar() {
  const modelId = useStudioStore((s) => s.modelId);
  const setModel = useStudioStore((s) => s.setModel);
  const sceneId = useStudioStore((s) => s.sceneId);
  const setSceneId = useStudioStore((s) => s.setSceneId);
  const garments = useStudioStore((s) => s.garments);
  const selectedGarmentId = useStudioStore((s) => s.selectedGarmentId);
  const selectGarment = useStudioStore((s) => s.selectGarment);
  const updateGarment = useStudioStore((s) => s.updateGarment);
  const removeGarment = useStudioStore((s) => s.removeGarment);
  const addGarment = useStudioStore((s) => s.addGarment);
  const watermark = useStudioStore((s) => s.watermark);
  const setWatermark = useStudioStore((s) => s.setWatermark);
  const exportLook = useStudioStore((s) => s.exportLook);
  const isCompositing = useStudioStore((s) => s.isCompositing);
  const progress = useStudioStore((s) => s.progress);
  const progressLabel = useStudioStore((s) => s.progressLabel);
  const modelLabel = useStudioStore((s) => s.modelLabel);

  const modelFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);
  const [brandName, setBrandName] = useState(watermark.text || "Local brand");
  const [productName, setProductName] = useState("Sản phẩm mới");

  const selected = garments.find((l) => l.id === selectedGarmentId) || null;

  async function onUploadModel(file: File) {
    try {
      const raw = await fileToDataUrl(file);
      const id = `custom_${Date.now().toString(36)}`;
      setModel(id, raw, file.name.replace(/\.[^.]+$/, "") || "Mẫu custom");
      toast.success("Đã thêm mẫu — sẽ tách nền khi xuất");
    } catch (e) {
      toast.error((e as Error).message || "Không tải được ảnh mẫu");
    }
  }

  async function onUploadProduct(file: File, kind?: GarmentKind) {
    try {
      const raw = await fileToDataUrl(file);
      const name = file.name.replace(/\.[^.]+$/, "") || "Sản phẩm";
      await addGarment({ src: raw, name, kind });
      setProductName(name);
      toast.success("Đã thêm layer sản phẩm");
    } catch (e) {
      toast.error((e as Error).message || "Không tải được ảnh sản phẩm");
    }
  }

  async function addSample(id: string) {
    const p = PRODUCT_SAMPLES.find((x) => x.id === id);
    if (!p) return;
    await addGarment({ src: p.src, name: p.name, kind: p.kind });
    setProductName(p.name);
  }

  async function onExport() {
    const dataUrl = await exportLook({ download: true });
    if (dataUrl) toast.success("Đã xuất PNG và lưu vào thư viện");
    else toast.error("Xuất look thất bại — kiểm tra mẫu/sản phẩm");
  }

  const vnScenes = VN_SCENES.filter((s) => s.group === "vn" || !s.group);
  const genzScenes = VN_SCENES.filter((s) => s.group === "genz");

  return (
    <div className="space-y-6 p-3 sm:p-4">
      {(isCompositing || progressLabel) && progress > 0 && progress < 100 && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
          <Loader2 className="size-3.5 animate-spin" />
          {progressLabel || "Đang xử lý…"} ({progress}%)
        </div>
      )}

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Brand
        </h2>
        <div className="mt-2 grid gap-2">
          <input
            value={brandName}
            onChange={(e) => {
              setBrandName(e.target.value);
              setWatermark({ text: e.target.value || "Fash Studio" });
            }}
            placeholder="Tên brand"
            className="w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-2 py-1.5 text-sm"
          />
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Tên sản phẩm"
            className="w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-2 py-1.5 text-sm"
          />
        </div>
      </section>

      {/* Chọn mẫu */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Chọn mẫu
          </h2>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => modelFileRef.current?.click()}
          >
            <Upload className="size-3.5" /> Tải lên
          </Button>
          <input
            ref={modelFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUploadModel(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              className={cn(
                "overflow-hidden rounded-[var(--radius-md)] border text-left",
                modelId === m.id ? "border-accent ring-1 ring-accent" : "border-border",
              )}
            >
              <img src={m.src} alt={m.name} className="aspect-[3/4] w-full object-cover" />
              <span className="block truncate px-1 py-0.5 text-[10px]">{m.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-fg-subtle">{modelLabel}</p>
      </section>

      {/* Scenes */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Cảnh Việt Nam
        </h2>
        <SceneGrid scenes={vnScenes} sceneId={sceneId} onPick={setSceneId} />
        <h2 className="mt-3 text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Gen Z
        </h2>
        <SceneGrid scenes={genzScenes} sceneId={sceneId} onPick={setSceneId} />
      </section>

      {/* Products */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Mẫu sản phẩm
          </h2>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => productFileRef.current?.click()}
          >
            <Upload className="size-3.5" /> Tải lên
          </Button>
          <input
            ref={productFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUploadProduct(f, "top");
              e.target.value = "";
            }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRODUCT_SAMPLES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => void addSample(p.id)}
              className="overflow-hidden rounded-[var(--radius-md)] border border-border text-left hover:border-accent"
            >
              <img src={p.src} alt={p.name} className="aspect-square w-full object-cover" />
              <span className="block truncate px-1 py-0.5 text-[10px]">{p.name}</span>
              <span className="block px-1 pb-1 text-[10px] text-fg-subtle">
                {formatVnd(p.priceVnd)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Layers */}
      <section>
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-accent" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Lớp sản phẩm
          </h2>
        </div>
        <ul className="mt-2 space-y-2">
          {garments.map((l) => (
            <li
              key={l.id}
              className={cn(
                "rounded-[var(--radius-md)] border p-2",
                selectedGarmentId === l.id
                  ? "border-accent bg-accent/5"
                  : "border-border",
              )}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left text-xs"
                onClick={() => selectGarment(l.id)}
              >
                <span className="truncate font-medium">
                  {l.processing ? "…" : ""}
                  {l.name}
                </span>
                <Badge variant="outline">{KIND_LABELS[l.kind] ?? l.kind}</Badge>
              </button>
              {selectedGarmentId === l.id && (
                <LayerSliders
                  layer={l}
                  onChange={(patch) => updateGarment(l.id, patch)}
                />
              )}
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  className="text-fg-subtle hover:text-danger"
                  onClick={() => removeGarment(l.id)}
                  aria-label="Xóa lớp"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
          {garments.length === 0 && (
            <li className="text-xs text-fg-muted">
              Chưa có lớp — chọn mẫu sản phẩm hoặc tải ảnh lên.
            </li>
          )}
        </ul>
        {selected && (
          <p className="mt-2 text-[10px] text-fg-subtle">
            Kéo lớp trên khung hình hoặc chỉnh cỡ / vị trí bằng thanh trượt.
          </p>
        )}
      </section>

      {/* Watermark thương hiệu */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Watermark thương hiệu
        </h2>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => setWatermark({ enabled: e.target.checked })}
          />
          Bật watermark
        </label>
        <input
          value={watermark.text}
          onChange={(e) => setWatermark({ text: e.target.value })}
          className="mt-2 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-2 py-1.5 text-sm"
          placeholder="Tên thương hiệu"
        />
        <input
          value={watermark.subtext}
          onChange={(e) => setWatermark({ subtext: e.target.value })}
          className="mt-2 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-2 py-1.5 text-sm"
          placeholder="Dòng phụ / @handle"
        />
        <label className="mt-2 block text-[10px] text-fg-muted">
          Độ mờ {Math.round(watermark.opacity * 100)}%
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={watermark.opacity}
            onChange={(e) => setWatermark({ opacity: Number(e.target.value) })}
            className="mt-1 w-full"
          />
        </label>
        <select
          value={watermark.position}
          onChange={(e) =>
            setWatermark({
              position: e.target.value as typeof watermark.position,
            })
          }
          className="mt-2 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-2 py-1.5 text-sm"
        >
          <option value="bottom-right">Góc phải dưới</option>
          <option value="bottom-left">Góc trái dưới</option>
          <option value="top-right">Góc phải trên</option>
          <option value="top-left">Góc trái trên</option>
          <option value="center">Giữa</option>
          <option value="tile">Lặp chéo</option>
        </select>
      </section>

      <Button
        type="button"
        className="w-full"
        onClick={() => void onExport()}
        disabled={isCompositing}
      >
        <Download className="size-4" /> Xuất look PNG
      </Button>

      <TikTokSeoPanel
        productName={productName}
        brand={brandName}
        scene={VN_SCENES.find((s) => s.id === sceneId)?.name}
        compact
      />
    </div>
  );
}

function SceneGrid({
  scenes,
  sceneId,
  onPick,
}: {
  scenes: Scene[];
  sceneId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-1.5">
      {scenes.map((s) => (
        <button
          key={s.id}
          type="button"
          title={s.name}
          onClick={() => onPick(s.id)}
          className={cn(
            "overflow-hidden rounded border",
            sceneId === s.id ? "border-accent ring-1 ring-accent" : "border-border",
          )}
        >
          {s.kind === "photo" && s.image ? (
            <img src={s.image} alt={s.name} className="aspect-[3/4] w-full object-cover" />
          ) : (
            <div
              className="flex aspect-[3/4] items-center justify-center px-0.5 text-center text-[9px] text-fg-muted"
              style={{
                background:
                  s.color && s.color !== "transparent" ? s.color : "#1c1916",
              }}
            >
              {s.name}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function LayerSliders({
  layer,
  onChange,
}: {
  layer: GarmentLayer;
  onChange: (patch: Partial<GarmentLayer>) => void;
}) {
  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      {(
        [
          ["scale", 0.1, 1.2, 0.01],
          ["x", 0.05, 0.95, 0.01],
          ["y", 0.05, 0.95, 0.01],
          ["rotation", -45, 45, 1],
          ["opacity", 0.2, 1, 0.05],
        ] as const
      ).map(([key, min, max, step]) => (
        <label key={key} className="block text-[10px] text-fg-muted">
          {key === "scale"
            ? "Cỡ"
            : key === "x"
              ? "Ngang"
              : key === "y"
                ? "Dọc"
                : key === "rotation"
                  ? "Xoay"
                  : "Độ mờ"}{" "}
          {Number(layer[key]).toFixed(key === "rotation" ? 0 : 2)}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={layer[key]}
            onChange={(e) => onChange({ [key]: Number(e.target.value) })}
            className="mt-0.5 w-full"
          />
        </label>
      ))}
    </div>
  );
}

function CreateCanvas() {
  const modelSrc = useStudioStore((s) => s.modelCutoutSrc || s.modelSrc);
  const sceneId = useStudioStore((s) => s.sceneId);
  const garments = useStudioStore((s) => s.garments);
  const selectedGarmentId = useStudioStore((s) => s.selectedGarmentId);
  const selectGarment = useStudioStore((s) => s.selectGarment);
  const updateGarment = useStudioStore((s) => s.updateGarment);
  const watermark = useStudioStore((s) => s.watermark);
  const scene = VN_SCENES.find((s) => s.id === sceneId);

  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, layer: GarmentLayer) => {
      e.preventDefault();
      e.stopPropagation();
      selectGarment(layer.id);
      dragRef.current = {
        id: layer.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: layer.x,
        origY: layer.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [selectGarment],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const frame = frameRef.current;
      if (!d || !frame) return;
      const rect = frame.getBoundingClientRect();
      const dx = (e.clientX - d.startX) / rect.width;
      const dy = (e.clientY - d.startY) / rect.height;
      updateGarment(d.id, {
        x: Math.min(0.95, Math.max(0.05, d.origX + dx)),
        y: Math.min(0.95, Math.max(0.05, d.origY + dy)),
      });
    },
    [updateGarment],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const bgStyle =
    scene?.kind === "solid" && scene.color && scene.color !== "transparent"
      ? { background: scene.color }
      : undefined;

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-semibold">Khung thử đồ</h1>
          <p className="text-xs text-fg-muted">
            Cảnh + mẫu + sản phẩm · kéo layer · watermark
          </p>
        </div>
        <Badge variant="outline">Xem trước 3:4</Badge>
      </div>

      <div
        ref={frameRef}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-xl)] border border-border bg-bg-muted shadow-2xl"
        style={bgStyle}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {scene?.kind === "photo" && scene.image && (
          <img
            src={scene.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}

        <img
          src={modelSrc}
          alt="Mẫu"
          className="absolute left-1/2 top-[8%] h-[88%] w-auto max-w-[92%] -translate-x-1/2 object-contain"
          style={{
            filter:
              scene?.kind === "photo"
                ? "drop-shadow(0 12px 24px rgba(0,0,0,0.35))"
                : undefined,
          }}
          draggable={false}
        />

        {garments.map((layer) => (
          <DraggableLayer
            key={layer.id}
            layer={layer}
            selected={selectedGarmentId === layer.id}
            onPointerDown={onPointerDown}
          />
        ))}

        {watermark.enabled && watermark.showOnPreview && (
          <div
            className={cn(
              "pointer-events-none absolute z-20 px-3 py-2 text-right",
              watermark.position === "bottom-right" && "bottom-3 right-3",
              watermark.position === "bottom-left" && "bottom-3 left-3 text-left",
              watermark.position === "top-right" && "right-3 top-3",
              watermark.position === "top-left" && "left-3 top-3 text-left",
              watermark.position === "center" &&
                "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center",
              watermark.position === "tile" &&
                "inset-0 flex items-center justify-center overflow-hidden",
            )}
            style={{ opacity: watermark.opacity, color: watermark.color || "#fff" }}
          >
            {watermark.position === "tile" ? (
              <div
                className="text-2xl font-semibold tracking-widest opacity-40"
                style={{ transform: `rotate(${watermark.tileAngle}deg)` }}
              >
                {Array.from({ length: 12 })
                  .map(() => watermark.text)
                  .join("   ·   ")}
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold drop-shadow-md">
                  {watermark.text}
                </div>
                {watermark.subtext && (
                  <div className="text-[10px] opacity-80 drop-shadow-md">
                    {watermark.subtext}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableLayer({
  layer,
  selected,
  onPointerDown,
}: {
  layer: GarmentLayer;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, layer: GarmentLayer) => void;
}) {
  const src = layer.cutoutSrc || layer.originalSrc;
  const size = layerDrawSize(layer.kind, 400, 500, 100, 133, layer.scale);
  const wPct = Math.min(90, Math.max(12, size.targetW));

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => onPointerDown(e, layer)}
      className={cn(
        "absolute z-10 cursor-grab touch-none active:cursor-grabbing",
        selected && "z-30 ring-2 ring-accent ring-offset-1 ring-offset-transparent",
        layer.processing && "opacity-50",
      )}
      style={{
        left: `${layer.x * 100}%`,
        top: `${layer.y * 100}%`,
        width: `${wPct}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
        opacity: layer.opacity,
      }}
    >
      <img
        src={src}
        alt={layer.name}
        className="pointer-events-none h-auto w-full select-none object-contain"
        draggable={false}
      />
    </div>
  );
}

function GalleryPanel() {
  const generations = useStudioStore((s) => s.generations);
  const clearGenerations = useStudioStore((s) => s.clearGenerations);
  const modelLabel = useStudioStore((s) => s.modelLabel);
  const watermark = useStudioStore((s) => s.watermark);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Thư viện look</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Ảnh đã xuất từ try-on — tải lại hoặc share caption.
          </p>
        </div>
        {generations.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={clearGenerations}>
            Xoá gallery
          </Button>
        )}
      </div>
      {generations.length === 0 ? (
        <p className="mt-10 text-center text-sm text-fg-muted">
          Chưa có look. Xuất PNG từ tab Thử đồ.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {generations.map((g) => (
            <figure
              key={g.id}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated"
            >
              <img
                src={g.dataUrl}
                alt={g.label}
                className="aspect-[3/4] w-full object-cover"
              />
              <figcaption className="space-y-2 p-2">
                <p className="truncate text-xs font-medium">{g.label}</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = g.dataUrl;
                      a.download = `${g.label || "look"}.png`;
                      a.click();
                    }}
                  >
                    <Download className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="flex-1"
                    onClick={() =>
                      void shareOrCopy({
                        title: `${g.label} · ${watermark.text || "Fash"}`,
                        text: `Look ${g.label} — Fash Studio thử đồ (${modelLabel})`,
                      }).then((r) =>
                        r === "failed"
                          ? toast.error("Chia sẻ thất bại")
                          : toast.success(r === "shared" ? "Đã chia sẻ" : "Đã sao chép"),
                      )
                    }
                  >
                    Share
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}

function PromptsAiTab() {
  const applyPromptCard = useStudioStore((s) => s.applyPromptCard);
  const setActiveTab = useStudioStore((s) => s.setActiveTab);
  const sceneId = useStudioStore((s) => s.sceneId);
  const watermark = useStudioStore((s) => s.watermark);
  const garments = useStudioStore((s) => s.garments);
  const scene = VN_SCENES.find((s) => s.id === sceneId);
  const productName = garments[0]?.name || "Sản phẩm local brand";

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 gap-4 p-4 lg:grid-cols-2 sm:p-6">
      <div className="space-y-3">
        <h1 className="font-display text-xl font-semibold">AI nội dung</h1>
        <p className="text-sm text-fg-muted">
          Prompt cards gợi ý scene + caption. Click để áp vào canvas.
        </p>
        <ul className="space-y-2">
          {PROMPTS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  applyPromptCard(p);
                  setActiveTab("create");
                  toast.success(`Đã áp dụng gợi ý: ${p.title}`);
                }}
                className="w-full rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-3 text-left hover:border-accent"
              >
                <p className="text-sm font-medium">{p.title}</p>
                <p className="mt-1 text-xs text-fg-muted">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-4">
        <AiContentPanel
          productName={productName}
          brand={watermark.text || "Local brand"}
          scene={scene?.name}
        />
        <TikTokSeoPanel
          productName={productName}
          brand={watermark.text || "Local brand"}
          scene={scene?.name}
          compact={false}
        />
      </div>
    </main>
  );
}

function VideoPanel() {
  const exportLook = useStudioStore((s) => s.exportLook);
  const isCompositing = useStudioStore((s) => s.isCompositing);
  const setProgress = useStudioStore((s) => s.setProgress);
  const progressLabel = useStudioStore((s) => s.progressLabel);
  const progress = useStudioStore((s) => s.progress);
  const watermark = useStudioStore((s) => s.watermark);
  const sceneId = useStudioStore((s) => s.sceneId);
  const garments = useStudioStore((s) => s.garments);

  const [presetId, setPresetId] = useState<TikTokVideoPresetId>("shop-hook");
  const [quality, setQuality] = useState<VideoQualityId>("tiktok");
  const [exporting, setExporting] = useState(false);

  const preset = TIKTOK_VIDEO_PRESETS.find((p) => p.id === presetId)!;
  const productName = garments[0]?.name || "Sản phẩm";
  const sceneName = VN_SCENES.find((s) => s.id === sceneId)?.name;

  async function exportVideo() {
    setExporting(true);
    try {
      setProgress(5, "Ghép look cho video…");
      const still = await exportLook({
        width: QUALITY_PRESETS[quality].width,
        height: QUALITY_PRESETS[quality].height,
        download: false,
      });
      if (!still) throw new Error("Không ghép được look");

      const result = await exportLookVideo({
        imageSrc: still,
        quality,
        width: preset.width,
        height: preset.height,
        durationSec: preset.durationSec,
        motion: preset.motion,
        caption: productName,
        brandOverlay: watermark.text || "Fash Studio",
        preferMp4: true,
        onProgress: (pct, label) => setProgress(pct, label),
      });
      downloadBlob(result.blob, result.filename);
      toast.success(`Đã tải video ${result.filename}`);
      setProgress(100, "Video xong");
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || "Xuất video thất bại");
      setProgress(0, "");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 gap-4 p-4 lg:grid-cols-[1fr_320px] sm:p-6">
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Clapperboard className="size-5 text-accent" />
          <h1 className="font-display text-xl font-semibold">Video TikTok</h1>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          Preset dọc 9:16 · hiệu ứng chuyển động · caption an toàn · watermark.
        </p>

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Preset TikTok
        </h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TIKTOK_VIDEO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={cn(
                "rounded-[var(--radius-lg)] border p-3 text-left",
                presetId === p.id
                  ? "border-accent bg-accent/10"
                  : "border-border hover:bg-bg-subtle",
              )}
            >
              <p className="text-sm font-medium">{p.name}</p>
              <p className="mt-1 text-xs text-fg-muted">{p.description}</p>
              <p className="mt-2 text-[10px] text-fg-subtle">
                {p.width}×{p.height} · {p.durationSec}s · {p.motion}
              </p>
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Chất lượng
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(QUALITY_PRESETS) as VideoQualityId[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs uppercase",
                quality === q
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-fg-muted",
              )}
            >
              {QUALITY_PRESETS[q].name}
            </button>
          ))}
        </div>

        <ul className="mt-6 space-y-1.5 rounded-[var(--radius-md)] border border-border bg-bg p-3">
          {TIKTOK_SHOP_CHECKLIST.slice(0, 5).map((c) => (
            <li key={c.id} className="text-xs text-fg-muted">
              <span className="font-medium text-fg">{c.label}</span> — {c.tip}
            </li>
          ))}
        </ul>

        <Button
          className="mt-6 w-full sm:w-auto"
          type="button"
          onClick={() => void exportVideo()}
          disabled={exporting || isCompositing}
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Video className="size-4" />
          )}
          Xuất video
        </Button>
        {(exporting || isCompositing) && (
          <p className="mt-2 text-xs text-accent">
            {progressLabel} {progress ? `(${progress}%)` : ""}
          </p>
        )}
      </div>

      <TikTokSeoPanel
        productName={productName}
        brand={watermark.text || "Local brand"}
        scene={sceneName}
        compact
      />
    </main>
  );
}

function ClientsPanel() {
  const hydrate = useCustomerLibrary((s) => s.hydrate);
  const customers = useCustomerLibrary((s) => s.customers);
  const addCustomer = useCustomerLibrary((s) => s.addCustomer);
  const removeCustomer = useCustomerLibrary((s) => s.removeCustomer);
  const setActiveCustomer = useCustomerLibrary((s) => s.setActiveCustomer);
  const activeCustomerId = useCustomerLibrary((s) => s.activeCustomerId);
  const setExportCustomerName = useStudioStore((s) => s.setExportCustomerName);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-6">
      <h1 className="font-display text-2xl font-semibold">Khách hàng</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Thư viện khách local brand — lưu trên thiết bị (localStorage).
      </p>

      <form
        className="mt-6 grid gap-2 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const id = addCustomer({ name, phone, note });
          setActiveCustomer(id);
          setExportCustomerName(name.trim());
          setName("");
          setPhone("");
          setNote("");
          toast.success("Đã thêm khách hàng");
        }}
      >
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên khách"
          className="rounded-[var(--radius-md)] border border-border bg-bg px-2 py-1.5 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="SĐT"
          className="rounded-[var(--radius-md)] border border-border bg-bg px-2 py-1.5 text-sm"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú / size"
          className="rounded-[var(--radius-md)] border border-border bg-bg px-2 py-1.5 text-sm sm:col-span-2"
        />
        <Button type="submit" className="sm:col-span-2">
          Thêm khách
        </Button>
      </form>

      <ul className="mt-6 space-y-2">
        {customers.map((c) => (
          <li
            key={c.id}
            className={cn(
              "flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border p-3",
              activeCustomerId === c.id ? "border-accent bg-accent/5" : "border-border",
            )}
          >
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() => {
                setActiveCustomer(c.id);
                setExportCustomerName(c.name);
              }}
            >
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-fg-muted">
                {[c.phone, c.note].filter(Boolean).join(" · ") || "Không ghi chú"}
              </p>
              {c.assets.length > 0 && (
                <p className="mt-1 text-[10px] text-fg-subtle">
                  {c.assets.length} asset
                </p>
              )}
            </button>
            <button
              type="button"
              className="text-fg-subtle hover:text-danger"
              onClick={() => removeCustomer(c.id)}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {customers.length === 0 && (
          <li className="text-center text-sm text-fg-muted">Chưa có khách hàng.</li>
        )}
      </ul>
    </main>
  );
}
