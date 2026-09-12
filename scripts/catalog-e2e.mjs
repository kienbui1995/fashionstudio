/**
 * E2E check for the Catalog ↔ Studio flow (B1):
 * shop + product on the dashboard → pick from catalog in the studio →
 * watermark + AI/SEO context follow the product.
 *
 * Usage:
 *   node scripts/catalog-e2e.mjs [baseUrl]
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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

// 1. Register + create shop + product (with photo) on the dashboard.
await page.goto(`${baseUrl}/register`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.getByLabel("Họ tên").fill("Chủ Catalog Test");
await page.getByLabel("Email").fill(`catalog${Date.now()}@shop.test`);
await page.getByLabel(/Mật khẩu/).fill("password123");
await page.getByRole("button", { name: "Tạo tài khoản" }).click();
await page.waitForURL("**/dashboard", { timeout: 10000 });
log("đăng ký xong → /dashboard");

await page.getByRole("button", { name: "Gian hàng", exact: true }).click();
await page.getByPlaceholder("Tên gian hàng mới…").fill("Atelier Hà Nội");
await page.getByRole("button", { name: "Tạo gian hàng" }).click();
await page.getByText("Atelier Hà Nội").first().waitFor({ timeout: 5000 });
log("tạo gian hàng OK");

await page.getByRole("button", { name: "Sản phẩm", exact: true }).click();
await page.getByPlaceholder(/Tên sản phẩm/).fill("Váy hoa midi");
await page.getByPlaceholder(/Giá/).fill("750000");
await page.locator("select").nth(1).selectOption({ label: "Atelier Hà Nội" });
await page.locator('input[type="file"]').setInputFiles("public/images/product-ao-so-mi.jpg");
await page.getByRole("button", { name: "Thêm sản phẩm" }).click();
await page.getByText("Váy hoa midi").first().waitFor({ timeout: 5000 });
log("thêm sản phẩm kèm ảnh OK");

// 2. Studio: pick the product from the catalog popover.
await page.getByRole("link", { name: "Mở studio" }).first().click();
await page.waitForURL("**/studio", { timeout: 10000 });
await page.waitForTimeout(2000);
await page.getByRole("button", { name: "Từ catalog" }).click();
await page.getByRole("button", { name: /Váy hoa midi/ }).click();
log("chọn sản phẩm từ catalog OK");

// Layer appears in the layer list (background removal runs async).
await page.getByText("Váy hoa midi").first().waitFor({ timeout: 15000 });

// 3. Product name + auto-filled watermark (shop name + product subtext).
const productNameInput = page.getByPlaceholder("Tên sản phẩm");
await productNameInput.waitFor();
const nameVal = await productNameInput.inputValue();
if (nameVal !== "Váy hoa midi") fail(`tên sản phẩm = ${nameVal}`);
else log("tên sản phẩm tự điền OK");

const wmText = await page
  .getByPlaceholder("Tên thương hiệu")
  .inputValue();
if (wmText !== "Atelier Hà Nội") fail(`watermark text = ${wmText}`);
else log("watermark tự điền tên gian hàng OK");

const wmSub = await page.getByPlaceholder("Dòng phụ / @handle").inputValue();
if (wmSub !== "Váy hoa midi") fail(`watermark subtext = ${wmSub}`);
else log("watermark subtext tự điền tên sản phẩm OK");

// 4. AI tab: generated content references the product.
await page.getByRole("button", { name: "AI nội dung" }).click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Tạo nội dung" }).click();
const body = page.locator("button.whitespace-pre-wrap");
await body.waitFor({ timeout: 10000 });
const generated = await body.textContent();
if (!generated?.includes("Váy hoa midi")) fail("caption không chứa tên sản phẩm");
else log("AI caption dùng đúng sản phẩm từ catalog");

if (errors.length) {
  console.error("PAGE ERRORS:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  log("không có lỗi console/pageerror");
}
await page.screenshot({ path: "screenshots/catalog-studio.png" });
await browser.close();
