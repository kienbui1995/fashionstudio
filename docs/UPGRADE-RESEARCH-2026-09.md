# Nghiên cứu nâng cấp kỹ thuật — Fash Studio (9/2026)

> Kết quả nghiên cứu chuyên sâu từ 5 luồng song song (try-on, AI content, video/TikTok,
> P2P realtime, dữ liệu & lưu trữ). Thông tin mới nhất tính đến 9/2026. Mục tiêu:
> app miễn phí/open-source cho local brand VN, chạy tốt trên điện thoại tầm trung.

## 0. Rủi ro cần xử sớm (trước khi thêm tính năng mới)

| # | Rủi ro | Chi tiết | Fix | Effort |
|---|---|---|---|---|
| R1 | **localStorage sắp đầy + Safari xoá sạch sau 7 ngày** | Quota ~5MB (UTF-16 → ~2.5M ký tự); 1 khách 64 ảnh asset hoặc 1 gallery 48 PNG là nổ. Safari ITP xoá localStorage + IndexedDB sau 7 ngày không tương tác — thị trường VN nhiều iOS, chung máy | Chuyển zustand persist sang IndexedDB qua `idb-keyval` (custom storage adapter), tách slice ảnh riêng; thêm `navigator.storage.persist()`; nút **Export/Import JSON** làm phương án cứu dữ liệu | S |
| R2 | **License `@imgly/background-removal` là AGPL-3.0** | App MIT — AGPL lẫn vào bundle client là rủi ro pháp lý khi thương mại hoá. Model tải từ CDN imgly (~40MB) | Rà soát: giữ imgly ngắn hạn + ghi credit, hoặc thay bằng ONNX BiRefNet-lite-512 (`studioludens/birefnet-lite-512`, code MIT) qua `onnxruntime-web`. **Tránh RMBG-2.0** (CC BY-NC 4.0, cần thoả thuận BRIA) | S–M |
| R3 | **`/api/ai-generate` công khai không có rate limit** | Ai cũng đốt key AI; Vercel tính theo invocation | `@upstash/ratelimit` + `@upstash/redis` (free 500K cmd/tháng), ~20 req/10 phút/user + cap `max_tokens` ~600-800 | S |

## 1. Try-on & image pipeline

**Khoảng cách:** layer ghép phẳng không có độ rủ/đổ bóng; không auto-fit (kéo tay trên mobile tệ); cutout ISNet đời cũ; ONNX WASM tốn pin trên Android tầm trung.

| Hướng | Chi tiết | Effort | Chi phí |
|---|---|---|---|
| **MediaPipe Pose auto-fit** ★ | `@mediapipe/tasks-vision` PoseLandmarker (33 landmark, model lite ~5.5MB, GPU delegate) → map vai/hông/cổ chân tự scale/đặt quần áo. Offline, chạy realtime trên mobile tầm trung | S–M | Free |
| **AI try-on render qua API host** ★ | fal `image-apps-v2/virtual-try-on` ~$0.04/ảnh; FASHN v1.6 $0.075 (~7s); FLUX Try-On Pro $0.0375. Input đúng thứ app đã có (ảnh người + ảnh quần áo sau cutout), proxy qua server fn, bán gói credit (20 render ≈ 60-90k VND) | S–M | ~$0.04/ảnh |
| Self-host VTON mở | **Bỏ qua**: CatVTON/IDM-VTON/OOTDiffusion/FitDiT đều **CC BY-NC 4.0** — cấm thương mại. Chỉ Leffa (ByteDance) được phép thương mại ($0.10/gen trên fal). Chỉ đáng tự host nếu >50-100k render/tháng | L | — |
| Matting tốt hơn cho xuất cuối | BiRefNet-lite-512 ONNX nếu nhận phàn nàn viền lace/chi tiết | M | Free |

Nguồn: fal.ai/learn/tools/best-virtual-try-on-apis-2026 · fashn.ai/pricing · developers.google.com/edge/mediapipe (pose_landmarker/web_js) · huggingface.co/briaai/RMBG-2.0 · github.com/imgly/background-removal-js

## 2. AI nội dung

**Khoảng cách:** không dùng vision dù có ảnh look; parse `TITLE:` dễ gãy; không rate limit; không nhớ giọng brand; chờ 10-30s không streaming.

| Hướng | Chi tiết | Effort | Chi phí |
|---|---|---|---|
| **Vision caption từ ảnh look thật** ★★ | **GLM-4.6V-Flash FREE** trên chính endpoint Z.ai đang cấu hình — gửi kèm ảnh canvas (data URL resize) dạng `image_url`; mô tả màu/chất liệu/blend trang phục thật thay vì đoán từ tên | S | $0 |
| **Structured output** ★ | Z.ai hỗ trợ chính thức JSON mode (`response_format: {type:"json_object"}`) — trả `{caption, hook, hashtags[], listing{}}` parse chắc chắn, giữ fallback template khi parse lỗi | S | Free |
| Brand profile (không RAG) | 1 bảng `brand_profile` (tone, từ khoá, câu chữ mẫu user thích) inject vào system prompt; chỉ cân nhắc pgvector khi brand có >50 caption lưu | S | Free |
| Streaming SSE | Vercel Node/Edge đã stream ổn định 2025+; test trên URL deploy thật (không chỉ vercel dev) | M | Free |
| Model cho tiếng Việt Gen-Z | Qwen3 (top-3 tiếng Việt theo SiliconFlow) / Gemini Flash có vẻ hay hơn GLM cho slang VN — nhờ kiến trúc OpenAI-compatible chỉ là đổi base/model, nên A/B thử | S | ~Free |

Nguồn: docs.z.ai/guides/overview/pricing · docs.z.ai/guides/vlm/glm-4.6v · docs.z.ai/guides/capabilities/struct-output · vercel.com/blog/streaming… · upstash.com/docs/redis/sdks/ratelimit-ts · siliconflow.com/articles/best-open-source-llm-for-vietnamese

## 3. Video & TikTok

**Phát hiện quan trọng: `mp4-muxer` đã DEPRECATED** — tác giả khuyến nghị chuyển sang **Mediabunny** (cùng tác giả, MIT, tree-shakable, có hướng dẫn migrate ~10 phút).

| Hướng | Chi tiết | Effort | Chi phí |
|---|---|---|---|
| **Migrate Mediabunny** ★ | `Output` + `Mp4OutputFormat` + `CanvasSource`; probe codec bằng `getFirstEncodableVideoCodec('avc')` | S | Free |
| **Render loop offline trong Web Worker** ★ | `latencyMode:"quality"`, render frame nhanh nhất có thể (không bám đồng hồ thật), backpressure qua `encodeQueueSize`, `VideoFrame.close()` trong `try/finally` (rò GPU memory "trong vài giây" nếu quên!), probe `isConfigSupported` + fallback 720p. H.264+AAC MP4 là công thức an toàn cho TikTok (AV1 không nhận upload) | M | Free |
| Ken-burns chuẩn hơn | Đường pan/zoom seed theo clip, đổi hướng xen kẽ, ease-in-out | S | Free |
| Caption burn-in kiểu karaoke | Vẽ chữ trên canvas theo từ; Whisper on-device (transformers.js) để auto-caption tiếng Việt nhưng model 40-250MB — rủi ro trên Android tầm trung, để opt-in sau | M / L | Free |
| Nhạc & bản quyền | TikTok Shop phải dùng **Commercial Music Library**: xuất video im + thêm nhạc CML trong app TikTok là mặc định an toàn; optionally cho user đính track royalty-free của họ (Mediabunny audio source) | S | Free |
| Beat-sync + TTS (giai đoạn sau) | `web-audio-beat-detector` để cắt theo beat; TTS BYO key (gpt-4o-mini-tts ~$0.015/phút; ElevenLabs tiếng Việt tốt hơn ~$5-6/tháng) — Web Speech API không capture được ra file | M | BYO key |

Nguồn: github.com/Vanilagy/mp4-muxer (deprecation) · mediabunny.dev · developer.chrome.com/docs/web-platform/best-practices/webcodecs · recapo.ai/blog/best-video-format-and-settings-for-tiktok · ads.tiktok.com (Commercial Music Library) · web-audio-beat-detector (npm)

## 4. P2P xem cùng nhau (B3)

**Phát hiện lớn: repo đã có sẵn bản tham chiếu signaling server** khớp 100% contract của `p2p.ts` — `.grok/skills/multiplayer-p2p/SKILL.md` (signaling.server.ts + mount `src/routes/api/rtc.ts`, dùng chính `getSql()` có sẵn). B3 chỉ còn **nửa ngày copy + chỉnh**:

- GET `/api/rtc?room&peer&name&since`: poll đầu (`since=0`) = join (upsert roster + trả peers); trả `signals` (offer/answer/ice) có `id` tăng dần (ICE không được vượt SDP), LIMIT ~200.
- POST: `{op:"signal"}` (payload ≤32KB), `{op:"leave"}`; GC tuỳ tiên qua poll, không cần cron. Tải ~0.5-2.5 req/s/client — vô tư trên Vercel.
- **Sync layer state (~20Hz, ~100B/msg) chứ KHÔNG stream frame** (3-6Mbps) — cách Figma/tldraw làm; channel unreliable cho transform, reliable cho thêm/bớt layer.
- **Bảo mật bắt buộc thêm:** contract hiện không có auth — thêm capability token (room code 128-bit hoặc HMAC `{room, role, exp}`); guest read-only bằng cách ignore state từ peer không phải owner.
- **TURN fallback:** ~20% kết nối cần relay (CGNAT Viettel/Vinaphone) — Metered Open Relay free 500MB/tháng; Vercel region `sin1` + Neon ap-southeast-1 để RTT VN ~10-40ms.

Nguồn: vercel.com/kb/guide/real-time-chat-websockets · trystero.dev · metered.ca/tools/openrelay · developers.cloudflare.com/realtime/turn · getstream.io/resources/projects/webrtc/advanced/stun-turn

## 5. Dữ liệu & lưu trữ

| Hướng | Chi tiết | Effort | Chi phí |
|---|---|---|---|
| **idb-keyval + Export JSON** ★ | Xem R1. IndexedDB cho phép GB; hydration async cần gate render (`onFinishHydration`) | S | Free |
| **Sync server DIY** ★ (giai đoạn sau) | Bảng shops/products/customers + `user_id` từ session; TanStack Query optimistic mutation + LWW theo `updatedAt`; rehydrate từ server khi login; IndexedDB làm cache offline. **Hợp lý hơn** TanStack DB (beta v0.6) / ElectricSQL sync plugin (alpha, read-only) / PowerSync (overkill) | M | Free |
| Ảnh lên Vercel Blob | Free tier Hobby; upload thẳng browser→Blob qua `handleUpload` + token có auth (vượt giới hạn body 4.5MB của serverless); URL CDN cache được thay cột text dataURL. UploadThing 1-2GB free; R2 10GB + egress free (cần tài khoản CF riêng) | S–M | Free tier |

Nguồn: developer.mozilla.org (Storage quotas) · webkit.org/tracking-prevention · zustand.docs.pmnd.rs (persist) · tanstack.com/db · pglite.dev/docs/sync · vercel.com/docs/vercel-blob/client-upload

## 6. Lộ trình đề xuất (sau khi xử R1-R3)

1. **Tuần này:** R1 (idb-keyval + export) → R3 (ratelimit) → GLM-4.6V-Flash vision caption (free, "wow" ngay) → migrate Mediabunny.
2. **Tuần sau:** B3 signaling (copy reference + token) → offline render loop trong Worker → brand profile.
3. **Tháng sau:** MediaPipe pose auto-fit → AI try-on render (fal/FASHN) bán credit → sync server + Vercel Blob.
4. **Cân nhắc chiến lược:** review license imgly (AGPL) trước khi quảng bá thương mại; A/B GLM vs Qwen3/Gemini cho tiếng Việt Gen-Z.
