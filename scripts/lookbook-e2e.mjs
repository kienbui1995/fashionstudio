/**
 * E2E check for the public lookbook (B4):
 * export a look in the studio → publish → open the /l/<id> link anonymously.
 *
 * Usage:
 *   node scripts/lookbook-e2e.mjs [baseUrl]
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
});

const log = (msg) => console.log("✓", msg);
const fail = (msg) => {
  console.error("✗", msg);
  process.exitCode = 1;
};

// 1. Register (fresh profile → local session).
await page.goto(`${baseUrl}/register`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.getByLabel("Họ tên").fill("Chủ Lookbook");
await page.getByLabel("Email").fill(`look${Date.now()}@shop.test`);
await page.getByLabel(/Mật khẩu/).fill("password123");
await page.getByRole("button", { name: "Tạo tài khoản" }).click();
await page.waitForURL("**/dashboard", { timeout: 10000 });
log("đăng ký OK");

// 2. Studio: export the default look (bg removal may take a while on first run).
await page.getByRole("link", { name: "Mở studio" }).first().click();
await page.waitForURL("**/studio", { timeout: 10000 });
await page.waitForTimeout(2000);
const exportBtn = page.getByRole("button", { name: "Xuất look PNG" });
await exportBtn.click();
await page
  .getByText("Đã xuất PNG và lưu vào thư viện")
  .waitFor({ timeout: 180_000 });
log("xuất look PNG OK");

// 3. Publish from the gallery.
await page.getByRole("button", { name: "Thư viện" }).click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Công khai" }).first().click();
const toast = page.locator("[data-sonner-toast]").filter({ hasText: "/l/look_" });
await toast.waitFor({ timeout: 20000 });
const toastText = await toast.first().textContent();
const sharePath = toastText?.match(/\/l\/look_[a-z0-9]+/)?.[0];
if (!sharePath) fail("không lấy được link /l/look_… từ toast");
else log(`link công khai: ${sharePath}`);

// 4. Anonymous visitor opens the link (fresh context, no session).
const anon = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const anonErrors = [];
anon.on("pageerror", (e) => anonErrors.push(String(e).slice(0, 200)));
await anon.goto(`${baseUrl}${sharePath}`, { waitUntil: "domcontentloaded" });
await anon.waitForTimeout(1500);
if (!(await anon.getByText("Atelier", { exact: false }).count()) &&
    !(await anon.getByText("Fash Studio").count()))
  fail("trang công khai không render");
const img = anon.locator("main img");
const imgSrc = await img.getAttribute("src");
if (!imgSrc?.startsWith("data:image")) fail("ảnh look không hiển thị");
else log("trang /l/<id> hiển thị ảnh look cho khách ẩn danh OK");
await anon.screenshot({ path: "screenshots/lookbook-public.png" });

// 5. Unknown id → not-found page, not a crash.
await anon.goto(`${baseUrl}/l/look_khongtontai`, { waitUntil: "domcontentloaded" });
await anon.waitForTimeout(1200);
const body404 = (await anon.textContent("body")) || "";
if (!/không tìm thấy|not found|404|trang/i.test(body404)) fail("thiếu trang not-found");
else log("id lạ → trang not-found OK");

if (errors.length) {
  console.error("OWNER PAGE ERRORS:\n" + errors.join("\n"));
  process.exitCode = 1;
}
if (anonErrors.length) {
  console.error("ANON PAGE ERRORS:\n" + anonErrors.join("\n"));
  process.exitCode = 1;
}
if (!errors.length && !anonErrors.length) log("không có lỗi console/pageerror");
await browser.close();
