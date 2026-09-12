/**
 * E2E check for the SME dashboard (register → shop → products → overview).
 *
 * Usage:
 *   node scripts/dashboard-e2e.mjs [baseUrl]
 *
 * Requires a Chromium-channel browser. Uses `channel: "chrome"` when present;
 * fall back to `npx playwright install chromium` and change the launch options
 * if you don't have Google Chrome installed.
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});

const log = (msg) => console.log("✓", msg);
const fail = (msg) => {
  console.error("✗", msg);
  process.exitCode = 1;
};

// 1. Register a fresh account (unique email so server auth accepts it too).
await page.goto(`${baseUrl}/register`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000); // let React hydrate before submitting
const email = `owner${Date.now()}@shop.test`;
await page.getByLabel("Họ tên").fill("Chủ Shop Test");
await page.getByLabel("Email").fill(email);
await page.getByLabel(/Mật khẩu/).fill("password123");
await page.getByRole("button", { name: "Tạo tài khoản" }).click();
await page.waitForURL("**/dashboard", { timeout: 10000 });
log("đăng ký xong → /dashboard");

// 2. Dashboard renders with all sections.
await page
  .getByRole("heading", { name: "Bảng điều khiển gian hàng" })
  .waitFor({ timeout: 5000 });
for (const tab of ["Tổng quan", "Sản phẩm", "Gian hàng", "Khách hàng"]) {
  if (!(await page.getByRole("button", { name: tab, exact: true }).isVisible()))
    fail("thiếu tab " + tab);
}
log("4 tab điều hướng hiển thị");

// 3. Create a shop.
await page.getByRole("button", { name: "Gian hàng", exact: true }).click();
await page.getByPlaceholder("Tên gian hàng mới…").fill("Atelier Hà Nội");
await page.getByRole("button", { name: "Tạo gian hàng" }).click();
await page.getByText("Atelier Hà Nội").first().waitFor({ timeout: 5000 });
log("tạo gian hàng OK");

// 4. Add products.
await page.getByRole("button", { name: "Sản phẩm", exact: true }).click();
await page.getByPlaceholder(/Tên sản phẩm/).fill("Áo sơ mi linen");
await page.getByPlaceholder(/Giá/).fill("1290000");
await page.getByRole("button", { name: "Thêm sản phẩm" }).click();
await page.getByText("Áo sơ mi linen").first().waitFor({ timeout: 5000 });
await page.getByText("1.290.000₫").waitFor({ timeout: 5000 });
log("thêm sản phẩm + giá VNĐ OK");

await page.locator("select").nth(1).selectOption({ label: "Atelier Hà Nội" });
await page.getByPlaceholder(/Tên sản phẩm/).fill("Quần ống rộng");
await page.getByPlaceholder(/Giá/).fill("890000");
await page.getByRole("button", { name: "Thêm sản phẩm" }).click();
await page.getByText("Quần ống rộng").first().waitFor({ timeout: 5000 });
log("sản phẩm thứ 2 gắn shop OK");

// 5. Shop filter renders without crashing.
await page.getByRole("button", { name: /Tất cả \(\d+\)/ }).click();
log("bộ lọc shop hoạt động");

// 6. Overview stats reflect the data.
await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
await page.getByText("Gian hàng").first().waitFor();
const statValues = await page.locator("main .grid button p").allTextContents();
console.log("  stats:", statValues.join(", "));
if (!statValues.includes("2")) fail("stats sản phẩm phải = 2");

// 7. Session + data survive a reload.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page
  .getByRole("heading", { name: "Bảng điều khiển gian hàng" })
  .waitFor({ timeout: 5000 });
await page.screenshot({ path: "screenshots/dashboard-final.png" });
log("reload giữ đăng nhập + dashboard render lại");

if (errors.length) {
  console.error("PAGE ERRORS:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  log("không có lỗi console/pageerror");
}
await browser.close();
