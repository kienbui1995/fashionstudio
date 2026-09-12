/** Zustand store for fashion try-on studio (full API + UI compat). */

import { create } from "zustand";
import {
  DEFAULT_WATERMARK,
  type GarmentKind,
  type WatermarkOptions,
  compositeLook,
  downloadDataUrl,
  fitGarmentInFrame,
  loadImage,
  removeBackgroundSmart,
  zoneForKind,
} from "@/lib/image-pipeline";
import {
  MODELS,
  PRODUCT_SAMPLES,
  PROMPTS,
  VN_SCENES,
  type PromptCard,
  type Scene,
  getPromptById,
  getSceneById,
  sceneImageSrc,
} from "@/lib/fashion-data";

const WM_STORAGE_KEY = "fash-wm-v1";

export type StudioTab =
  | "create"
  | "gallery"
  | "prompts"
  | "video"
  | "clients"
  | "ai";

export type GarmentLayer = {
  id: string;
  name: string;
  kind: GarmentKind;
  originalSrc: string;
  cutoutSrc: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  processing: boolean;
};

/** Layer shape used by studio canvas UI */
export type StudioLayer = {
  id: string;
  name: string;
  imageSrc: string;
  kind: GarmentKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  flipX: boolean;
  visible: boolean;
};

export type CustomAsset = {
  id: string;
  name: string;
  src: string;
  kind?: GarmentKind;
};

export type GalleryItem = {
  id: string;
  dataUrl: string;
  createdAt: string;
  label: string;
};

export type GenerationItem = {
  id: string;
  dataUrl: string;
  createdAt: number;
  sceneId: string;
  modelId: string;
  label: string;
  customerName?: string;
};

export type TrendSnapshot = {
  productLabel: string;
  tags: string[];
  hooks: string[];
  scenes: string[];
  updatedAt: number;
} | null;

function loadWatermark(): WatermarkOptions {
  if (typeof window === "undefined") return { ...DEFAULT_WATERMARK };
  try {
    const raw = localStorage.getItem(WM_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WATERMARK };
    const parsed = JSON.parse(raw) as Partial<WatermarkOptions>;
    return { ...DEFAULT_WATERMARK, ...parsed };
  } catch {
    return { ...DEFAULT_WATERMARK };
  }
}

function saveWatermark(wm: WatermarkOptions) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WM_STORAGE_KEY, JSON.stringify(wm));
  } catch {
    /* ignore */
  }
}

function uid(prefix = "g"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function guessKind(name: string): GarmentKind {
  const n = name.toLowerCase();
  if (/dress|váy|dam/.test(n)) return "dress";
  if (/pants|quần|jean|skirt|chân váy/.test(n)) return "bottom";
  if (/bag|túi|clutch/.test(n)) return "bag";
  if (/shoe|giày|sandal|sneaker/.test(n)) return "shoes";
  if (/jewel|nhẫn|vòng|earring|dây chuyền/.test(n)) return "jewelry";
  if (/hat|mũ|belt|thắt|scarf|khăn|accessory|phụ kiện/.test(n))
    return "accessory";
  if (/top|áo|shirt|blouse|hoodie/.test(n)) return "top";
  return "other";
}

function garmentToLayer(g: GarmentLayer): StudioLayer {
  return {
    id: g.id,
    name: g.name,
    imageSrc: g.cutoutSrc || g.originalSrc,
    kind: g.kind,
    x: g.x,
    y: g.y,
    scale: g.scale,
    rotation: g.rotation,
    opacity: g.opacity,
    flipX: false,
    visible: true,
  };
}

function layerToGarment(l: StudioLayer): GarmentLayer {
  return {
    id: l.id,
    name: l.name,
    kind: l.kind,
    originalSrc: l.imageSrc,
    cutoutSrc: l.imageSrc,
    x: l.x,
    y: l.y,
    scale: l.scale,
    rotation: l.rotation,
    opacity: l.opacity,
    processing: false,
  };
}

const defaultModel = MODELS[0]!;
const defaultProduct = PRODUCT_SAMPLES[0]!;
const defaultZone = zoneForKind(defaultProduct.kind);

type StudioState = {
  // —— primary API (user spec) ——
  modelSrc: string;
  modelId: string;
  modelLabel: string;
  modelCutoutSrc: string | null;
  modelCutoutForSrc: string | null;
  garments: GarmentLayer[];
  selectedGarmentId: string | null;
  sceneId: string;
  isCompositing: boolean;
  progress: number;
  progressLabel: string;
  generations: GenerationItem[];
  activeTab: StudioTab;
  watermark: WatermarkOptions;
  lastTrend: TrendSnapshot;
  trendLoading: boolean;
  exportCustomerName: string;
  /** Price of the catalog product behind the current look (AI/SEO context). */
  catalogPriceVnd: number | null;
  /** Category of the catalog product behind the current look. */
  catalogCategory: string | null;
  /** True once the user edits watermark fields by hand — stops auto-fill. */
  watermarkTouched: boolean;

  // —— UI compat ——
  tab: StudioTab;
  customModels: CustomAsset[];
  layers: StudioLayer[];
  selectedLayerId: string | null;
  brandName: string;
  productName: string;
  gallery: GalleryItem[];
  videoPresetId: string;
  videoQuality: "draft" | "hd" | "max";
  isProcessing: boolean;
  processMsg: string;

  setModel: (id: string, src?: string, label?: string) => void;
  ensureModelCutout: () => Promise<string | null>;
  addGarment: (opts: {
    src: string;
    name?: string;
    kind?: GarmentKind;
    priceVnd?: number | null;
    category?: string;
  }) => Promise<string>;
  removeGarment: (id: string) => void;
  updateGarment: (id: string, patch: Partial<GarmentLayer>) => void;
  reprocessGarment: (id: string) => Promise<void>;
  setSceneId: (id: string) => void;
  selectGarment: (id: string | null) => void;
  setActiveTab: (tab: StudioTab) => void;
  setWatermark: (
    patch: Partial<WatermarkOptions>,
    opts?: { touched?: boolean },
  ) => void;
  resetWatermark: () => void;
  exportLook: (opts?: {
    width?: number;
    height?: number;
    download?: boolean;
    filename?: string;
  }) => Promise<string | null>;
  applyPromptCard: (cardOrId: PromptCard | string) => void;
  setProgress: (pct: number, label?: string) => void;
  setExportCustomerName: (name: string) => void;
  setLastTrend: (trend: TrendSnapshot) => void;
  setTrendLoading: (v: boolean) => void;
  clearGenerations: () => void;
  getActiveScene: () => Scene | undefined;

  // UI methods
  setTab: (tab: StudioTab) => void;
  setModelId: (id: string | null) => void;
  addCustomModel: (asset: CustomAsset) => void;
  addLayer: (layer: Omit<StudioLayer, "id"> & { id?: string }) => void;
  updateLayer: (id: string, patch: Partial<StudioLayer>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  setBrandName: (v: string) => void;
  setProductName: (v: string) => void;
  addGalleryItem: (
    item: Omit<GalleryItem, "id" | "createdAt"> & { id?: string },
  ) => void;
  removeGalleryItem: (id: string) => void;
  setVideoPresetId: (id: string) => void;
  setVideoQuality: (q: StudioState["videoQuality"]) => void;
  setProcessing: (on: boolean, msg?: string) => void;
  resetLook: () => void;
};

function syncLayersFromGarments(garments: GarmentLayer[]): StudioLayer[] {
  return garments.map(garmentToLayer);
}

function syncGarmentsFromLayers(layers: StudioLayer[]): GarmentLayer[] {
  return layers.map(layerToGarment);
}

export const useStudioStore = create<StudioState>((set, get) => {
  const sampleLayer: StudioLayer = {
    id: "layer_sample",
    name: defaultProduct.name,
    imageSrc: defaultProduct.src,
    kind: defaultProduct.kind,
    x: defaultZone.cx,
    y: defaultZone.cy,
    scale: defaultZone.scale,
    rotation: 0,
    opacity: 1,
    flipX: false,
    visible: true,
  };

  return {
    modelSrc: defaultModel.src,
    modelId: defaultModel.id,
    modelLabel: defaultModel.label,
    modelCutoutSrc: null,
    modelCutoutForSrc: null,
    garments: [layerToGarment(sampleLayer)],
    selectedGarmentId: sampleLayer.id,
    sceneId: "studio-cream",
    isCompositing: false,
    progress: 0,
    progressLabel: "",
    generations: [],
    activeTab: "create",
    watermark: {
      ...loadWatermark(),
      enabled: true,
      text: "Fash Studio",
      subtext: "local brand",
    },
    lastTrend: null,
    trendLoading: false,
    exportCustomerName: "",
    catalogPriceVnd: null,
    catalogCategory: null,
    watermarkTouched: false,

    tab: "create",
    customModels: [],
    layers: [sampleLayer],
    selectedLayerId: sampleLayer.id,
    brandName: "Local brand",
    productName: defaultProduct.name,
    gallery: [],
    videoPresetId: "shop-hook",
    videoQuality: "hd",
    isProcessing: false,
    processMsg: "",

    setModel(id, src, label) {
      const found = MODELS.find((m) => m.id === id);
      const custom = get().customModels.find((m) => m.id === id);
      const nextSrc = src ?? custom?.src ?? found?.src ?? get().modelSrc;
      const nextLabel =
        label ?? custom?.name ?? found?.label ?? found?.name ?? id;
      set({
        modelId: id,
        modelSrc: nextSrc,
        modelLabel: nextLabel,
        modelCutoutSrc: custom ? nextSrc : null,
        modelCutoutForSrc: custom ? nextSrc : null,
      });
    },

    async ensureModelCutout() {
      const { modelSrc, modelCutoutSrc, modelCutoutForSrc } = get();
      if (modelCutoutSrc && modelCutoutForSrc === modelSrc) return modelCutoutSrc;
      set({
        progress: 8,
        progressLabel: "Tách nền mẫu…",
        isProcessing: true,
        processMsg: "Tách nền mẫu…",
      });
      try {
        const cutout = await removeBackgroundSmart(
          modelSrc,
          (msg, pct) =>
            set({
              progressLabel: msg,
              progress: pct ?? get().progress,
              processMsg: msg,
            }),
          { maxSide: 960 },
        );
        set({
          modelCutoutSrc: cutout,
          modelCutoutForSrc: modelSrc,
          progress: 100,
          progressLabel: "Mẫu sẵn sàng",
          isProcessing: false,
          processMsg: "",
        });
        return cutout;
      } catch (err) {
        console.warn("[studio] model cutout failed", err);
        set({
          progressLabel: "Tách nền mẫu thất bại",
          progress: 0,
          isProcessing: false,
          processMsg: "",
        });
        return null;
      }
    },

    async addGarment({ src, name, kind, priceVnd, category }) {
      const id = uid("garment");
      const fileName = name || `Sản phẩm ${get().garments.length + 1}`;
      const gKind = kind ?? guessKind(fileName);
      const zone = zoneForKind(gKind);
      const preserveDetail =
        gKind === "bag" || gKind === "accessory" || gKind === "jewelry";

      const layer: GarmentLayer = {
        id,
        name: fileName,
        kind: gKind,
        originalSrc: src,
        cutoutSrc: null,
        x: zone.cx,
        y: zone.cy,
        scale: zone.scale,
        rotation: 0,
        opacity: 1,
        processing: true,
      };

      set((s) => {
        const garments = [...s.garments, layer];
        return {
          garments,
          layers: syncLayersFromGarments(garments),
          selectedGarmentId: id,
          selectedLayerId: id,
          productName: fileName,
          catalogPriceVnd: priceVnd ?? null,
          catalogCategory: category ?? null,
          progress: 5,
          progressLabel: `Tách nền ${fileName}…`,
          isProcessing: true,
          processMsg: `Tách nền ${fileName}…`,
        };
      });

      try {
        const cutout = await removeBackgroundSmart(
          src,
          (msg, pct) =>
            set({
              progressLabel: msg,
              progress: pct ?? get().progress,
              processMsg: msg,
            }),
          { preserveDetail, maxSide: preserveDetail ? 1024 : 768 },
        );

        let placement = { x: zone.cx, y: zone.cy, scale: zone.scale };
        try {
          const img = await loadImage(cutout);
          placement = fitGarmentInFrame(
            gKind,
            img.naturalWidth,
            img.naturalHeight,
            placement,
          );
        } catch {
          /* keep */
        }

        set((s) => {
          const garments = s.garments.map((g) =>
            g.id === id
              ? {
                  ...g,
                  cutoutSrc: cutout,
                  x: placement.x,
                  y: placement.y,
                  scale: placement.scale,
                  processing: false,
                }
              : g,
          );
          return {
            garments,
            layers: syncLayersFromGarments(garments),
            progress: 100,
            progressLabel: "Sản phẩm sẵn sàng",
            isProcessing: false,
            processMsg: "",
          };
        });
      } catch (err) {
        console.warn("[studio] garment cutout failed", err);
        set((s) => {
          const garments = s.garments.map((g) =>
            g.id === id ? { ...g, cutoutSrc: src, processing: false } : g,
          );
          return {
            garments,
            layers: syncLayersFromGarments(garments),
            progress: 0,
            progressLabel: "Tách nền SP lỗi — dùng ảnh gốc",
            isProcessing: false,
            processMsg: "",
          };
        });
      }

      return id;
    },

    removeGarment(id) {
      set((s) => {
        const garments = s.garments.filter((g) => g.id !== id);
        const selected =
          s.selectedGarmentId === id ? null : s.selectedGarmentId;
        return {
          garments,
          layers: syncLayersFromGarments(garments),
          selectedGarmentId: selected,
          selectedLayerId: selected,
        };
      });
    },

    updateGarment(id, patch) {
      set((s) => {
        const garments = s.garments.map((g) =>
          g.id === id ? { ...g, ...patch } : g,
        );
        return { garments, layers: syncLayersFromGarments(garments) };
      });
    },

    async reprocessGarment(id) {
      const g = get().garments.find((x) => x.id === id);
      if (!g) return;
      const preserveDetail =
        g.kind === "bag" || g.kind === "accessory" || g.kind === "jewelry";
      set((s) => {
        const garments = s.garments.map((x) =>
          x.id === id ? { ...x, processing: true } : x,
        );
        return {
          garments,
          layers: syncLayersFromGarments(garments),
          progress: 5,
          progressLabel: `Tách lại ${g.name}…`,
          isProcessing: true,
          processMsg: `Tách lại ${g.name}…`,
        };
      });
      try {
        const cutout = await removeBackgroundSmart(
          g.originalSrc,
          (msg, pct) =>
            set({
              progressLabel: msg,
              progress: pct ?? get().progress,
              processMsg: msg,
            }),
          { preserveDetail, maxSide: preserveDetail ? 1024 : 768 },
        );
        let placement = { x: g.x, y: g.y, scale: g.scale };
        try {
          const img = await loadImage(cutout);
          placement = fitGarmentInFrame(
            g.kind,
            img.naturalWidth,
            img.naturalHeight,
            placement,
          );
        } catch {
          /* keep */
        }
        set((s) => {
          const garments = s.garments.map((x) =>
            x.id === id
              ? {
                  ...x,
                  cutoutSrc: cutout,
                  x: placement.x,
                  y: placement.y,
                  scale: placement.scale,
                  processing: false,
                }
              : x,
          );
          return {
            garments,
            layers: syncLayersFromGarments(garments),
            progress: 100,
            progressLabel: "Đã tách lại nền",
            isProcessing: false,
            processMsg: "",
          };
        });
      } catch (err) {
        console.warn("[studio] reprocess failed", err);
        set((s) => {
          const garments = s.garments.map((x) =>
            x.id === id ? { ...x, processing: false } : x,
          );
          return {
            garments,
            layers: syncLayersFromGarments(garments),
            progressLabel: "Tách lại thất bại",
            progress: 0,
            isProcessing: false,
            processMsg: "",
          };
        });
      }
    },

    setSceneId(id) {
      set({ sceneId: id ?? "keep" });
    },

    selectGarment(id) {
      set({ selectedGarmentId: id, selectedLayerId: id });
    },

    setActiveTab(tab) {
      set({ activeTab: tab, tab });
    },

    setWatermark(patch, opts) {
      const next = { ...get().watermark, ...patch };
      saveWatermark(next);
      set({ watermark: next, watermarkTouched: opts?.touched ?? true });
    },

    resetWatermark() {
      const next = { ...DEFAULT_WATERMARK };
      saveWatermark(next);
      set({ watermark: next });
    },

    async exportLook(opts) {
      const state = get();
      const width = opts?.width ?? 1080;
      const height = opts?.height ?? 1440;
      const scene = getSceneById(state.sceneId) ?? VN_SCENES[0]!;

      set({
        isCompositing: true,
        isProcessing: true,
        progress: 10,
        progressLabel: "Đang ghép look…",
        processMsg: "Đang ghép look…",
      });

      try {
        let modelSrc = resolveModelSrc(state);
        const needsCutout =
          scene.kind === "photo" ||
          (scene.kind === "solid" &&
            !!scene.color &&
            scene.color !== "transparent");

        if (needsCutout && !state.customModels.some((m) => m.id === state.modelId)) {
          const cut = await get().ensureModelCutout();
          if (cut) modelSrc = cut;
        }

        const layers = state.layers
          .filter((l) => l.visible)
          .map((l) => ({
            imageSrc: l.imageSrc,
            x: l.x,
            y: l.y,
            scale: l.scale,
            rotation: l.rotation,
            opacity: l.opacity,
            flipX: l.flipX,
            kind: l.kind,
          }));

        set({ progress: 55, progressLabel: "Composite canvas…", processMsg: "Composite…" });

        const dataUrl = await compositeLook({
          modelSrc,
          modelCutout: needsCutout,
          layers,
          width,
          height,
          backdropColor:
            scene.kind === "solid" &&
            scene.color &&
            scene.color !== "transparent"
              ? scene.color
              : scene.id === "keep"
                ? null
                : "#0a0a0b",
          backdropImage: sceneImageSrc(scene),
          watermark: state.watermark.enabled ? state.watermark : null,
          format: "image/png",
        });

        const item: GenerationItem = {
          id: uid("look"),
          dataUrl,
          createdAt: Date.now(),
          sceneId: state.sceneId,
          modelId: state.modelId,
          label: state.productName || state.modelLabel,
          customerName: state.exportCustomerName || undefined,
        };

        const galleryItem: GalleryItem = {
          id: item.id,
          dataUrl,
          createdAt: new Date().toISOString(),
          label: item.label,
        };

        set((s) => ({
          generations: [item, ...s.generations].slice(0, 48),
          gallery: [galleryItem, ...s.gallery].slice(0, 48),
          isCompositing: false,
          isProcessing: false,
          progress: 100,
          progressLabel: "Xuất look xong",
          processMsg: "",
        }));

        if (opts?.download !== false) {
          const safe =
            opts?.filename ||
            `fash-look-${state.modelId}-${state.sceneId}-${Date.now()}.png`;
          downloadDataUrl(dataUrl, safe);
        }

        return dataUrl;
      } catch (err) {
        console.error("[studio] exportLook", err);
        set({
          isCompositing: false,
          isProcessing: false,
          progress: 0,
          progressLabel: "Xuất look thất bại",
          processMsg: "",
        });
        return null;
      }
    },

    applyPromptCard(cardOrId) {
      const card =
        typeof cardOrId === "string" ? getPromptById(cardOrId) : cardOrId;
      if (!card) return;
      const scene = getSceneById(card.sceneId);
      set({
        sceneId: scene?.id ?? card.sceneId,
        activeTab: "create",
        tab: "create",
        progressLabel: `Áp prompt: ${card.title}`,
      });
    },

    setProgress(pct, label) {
      set({
        progress: pct,
        ...(label !== undefined
          ? { progressLabel: label, processMsg: label }
          : {}),
      });
    },

    setExportCustomerName(name) {
      set({ exportCustomerName: name });
    },

    setLastTrend(trend) {
      set({ lastTrend: trend });
    },

    setTrendLoading(v) {
      set({ trendLoading: v });
    },

    clearGenerations() {
      set({ generations: [], gallery: [] });
    },

    getActiveScene() {
      return getSceneById(get().sceneId);
    },

    // —— UI methods ——
    setTab(tab) {
      set({ tab, activeTab: tab === "ai" ? "prompts" : tab });
    },

    setModelId(id) {
      if (!id) return;
      get().setModel(id);
    },

    addCustomModel(asset) {
      set((s) => ({
        customModels: [asset, ...s.customModels].slice(0, 16),
        modelId: asset.id,
        modelSrc: asset.src,
        modelLabel: asset.name,
        modelCutoutSrc: asset.src,
        modelCutoutForSrc: asset.src,
      }));
    },

    addLayer(layer) {
      const id = layer.id || uid("layer");
      const next: StudioLayer = {
        id,
        name: layer.name,
        imageSrc: layer.imageSrc,
        kind: layer.kind,
        x: layer.x,
        y: layer.y,
        scale: layer.scale,
        rotation: layer.rotation ?? 0,
        opacity: layer.opacity ?? 1,
        flipX: layer.flipX ?? false,
        visible: layer.visible ?? true,
      };
      set((s) => {
        const layers = [...s.layers, next];
        return {
          layers,
          garments: syncGarmentsFromLayers(layers),
          selectedLayerId: id,
          selectedGarmentId: id,
          productName: layer.name || s.productName,
        };
      });
    },

    updateLayer(id, patch) {
      set((s) => {
        const layers = s.layers.map((l) =>
          l.id === id ? { ...l, ...patch } : l,
        );
        return {
          layers,
          garments: syncGarmentsFromLayers(layers),
        };
      });
    },

    removeLayer(id) {
      set((s) => {
        const layers = s.layers.filter((l) => l.id !== id);
        const selected =
          s.selectedLayerId === id
            ? (layers[layers.length - 1]?.id ?? null)
            : s.selectedLayerId;
        return {
          layers,
          garments: syncGarmentsFromLayers(layers),
          selectedLayerId: selected,
          selectedGarmentId: selected,
        };
      });
    },

    selectLayer(id) {
      set({ selectedLayerId: id, selectedGarmentId: id });
    },

    setBrandName(brandName) {
      set({ brandName });
    },

    setProductName(productName) {
      set({ productName });
    },

    addGalleryItem(item) {
      const entry: GalleryItem = {
        id: item.id || uid("look"),
        dataUrl: item.dataUrl,
        label: item.label,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        gallery: [entry, ...s.gallery].slice(0, 48),
        generations: [
          {
            id: entry.id,
            dataUrl: entry.dataUrl,
            createdAt: Date.now(),
            sceneId: s.sceneId,
            modelId: s.modelId,
            label: entry.label,
          },
          ...s.generations,
        ].slice(0, 48),
      }));
    },

    removeGalleryItem(id) {
      set((s) => ({
        gallery: s.gallery.filter((g) => g.id !== id),
        generations: s.generations.filter((g) => g.id !== id),
      }));
    },

    setVideoPresetId(videoPresetId) {
      set({ videoPresetId });
    },

    setVideoQuality(videoQuality) {
      set({ videoQuality });
    },

    setProcessing(isProcessing, processMsg = "") {
      set({
        isProcessing,
        processMsg,
        progressLabel: processMsg,
        isCompositing: isProcessing,
      });
    },

    resetLook() {
      const p = PRODUCT_SAMPLES[0]!;
      const zone = zoneForKind(p.kind);
      const layer: StudioLayer = {
        id: uid("layer"),
        name: p.name,
        imageSrc: p.src,
        kind: p.kind,
        x: zone.cx,
        y: zone.cy,
        scale: zone.scale,
        rotation: 0,
        opacity: 1,
        flipX: false,
        visible: true,
      };
      set({
        layers: [layer],
        garments: [layerToGarment(layer)],
        productName: p.name,
        selectedLayerId: layer.id,
        selectedGarmentId: layer.id,
      });
    },
  };
});

export function resolveModelSrc(
  state: Pick<StudioState, "modelId" | "modelSrc" | "customModels">,
) {
  const custom = state.customModels.find((m) => m.id === state.modelId);
  if (custom) return custom.src;
  return (
    MODELS.find((m) => m.id === state.modelId)?.src ||
    state.modelSrc ||
    MODELS[0]!.src
  );
}

export function resolveSceneSrc(sceneId: string | null) {
  if (!sceneId) return null;
  return sceneImageSrc(getSceneById(sceneId));
}

export { PROMPTS, MODELS, VN_SCENES };
export type { Scene, PromptCard };
