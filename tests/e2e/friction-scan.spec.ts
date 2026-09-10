import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { scanResponse } from "./friction-fixture";

async function fillScan(page: Page) {
  await page.getByLabel("Page URL", { exact: true }).fill("https://example.com/payroll");
  await page.getByLabel("What should this page make people do?").fill("Book a demo");
}
test("public scan has approved copy, validation, keyboard access and accessible desktop/mobile/320px layout", async ({ page }, testInfo) => {
  await page.goto("/website-friction-scan/");
  await expect(page).toHaveTitle("Free Website Friction Scan | Andy Good");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What’s stopping this page from working harder?");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("nav").getByRole("link", { name: /scan/i })).toHaveCount(0);
  await page.getByRole("button", { name: "Scan my page" }).click();
  await expect(page.getByLabel("Page URL", { exact: true })).toBeFocused();
  await page.getByLabel("Page URL", { exact: true }).fill("malformed");
  expect(await page.getByLabel("Page URL", { exact: true }).evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  await expect(page.getByRole("heading", { name: "Want the full scan?" })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("scan-form.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("scan-form-320.png"), fullPage: true });
});

test("loading shows elapsed time, prevents duplicate scans and allows cancellation", async ({ page }) => {
  let requests = 0;
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/website-friction-scan/", async (route) => { requests++; await waiting; await route.fulfill({ json: scanResponse }).catch(() => {}); });
  await page.goto("/website-friction-scan/");
  await fillScan(page);
  await page.getByRole("button", { name: "Scan my page" }).click();
  await expect(page.getByRole("status")).toHaveText("Reading the page");
  await expect(page.getByRole("button", { name: "Scanning your page…" })).toBeDisabled();
  await expect(page.getByText("This usually takes less than a minute.", { exact: false })).toBeVisible();
  await expect(page.getByText("1s elapsed", { exact: true })).toBeVisible();
  expect(requests).toBe(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Cancel scan" }).click();
  release();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Scan cancelled");
  await expect(page.getByRole("button", { name: "Scan my page" })).toBeEnabled();
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("complete preview remains visible through email failure, retry and success", async ({ page }, testInfo) => {
  await page.route("**/api/website-friction-scan/", (route) => route.fulfill({ json: scanResponse }));
  let sends = 0;
  await page.route("**/api/website-friction-scan/report/", (route) => {
    sends++;
    expect(route.request().postDataJSON()).toEqual({ email: "visitor@example.com", token: scanResponse.token });
    return route.fulfill(sends === 1 ? { status: 502, json: { error: "Email delivery failed. Please retry." } } : { json: { message: "Your report has been sent. Check your inbox and spam folder." } });
  });
  await page.goto("/website-friction-scan/");
  await fillScan(page);
  await page.getByRole("button", { name: "Scan my page" }).click();
  await expect(page.getByRole("heading", { name: "Your Website Friction Scan" })).toBeFocused();
  await expect(page.getByText("Needs attention", { exact: true })).toBeVisible();
  await expect(page.getByRole("article").locator("ol > li")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "What’s working" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What I’d fix first" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("scan-result.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("scan-result-320.png"), fullPage: true });
  await page.getByRole("button", { name: "Send me the full scan" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  expect(sends).toBe(0);
  await page.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await page.getByRole("button", { name: "Send me the full scan" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email delivery failed. Please retry.");
  await expect(page.getByRole("article").locator("ol > li")).toHaveCount(3);
  await page.getByRole("button", { name: "Send me the full scan" }).click();
  await expect(page.getByRole("status")).toContainText("Your report has been sent");
  await expect(page.getByRole("button", { name: "Report sent", exact: true })).toBeDisabled();
  expect(sends).toBe(2);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("source/provider error displays no fabricated result and permits another scan", async ({ page }) => {
  await page.route("**/api/website-friction-scan/", (route) => route.fulfill({ status: 422, json: { error: "We could not read this public page." } }));
  await page.goto("/website-friction-scan/");
  await fillScan(page);
  await page.getByRole("button", { name: "Scan my page" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not read");
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Scan my page" })).toBeEnabled();
});

test("email in flight blocks duplicate submissions", async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  let calls = 0;
  await page.route("**/api/website-friction-scan/", (route) => route.fulfill({ json: scanResponse }));
  await page.route("**/api/website-friction-scan/report/", async (route) => { calls++; await waiting; await route.fulfill({ json: { message: "Your report has been sent." } }); });
  await page.goto("/website-friction-scan/"); await fillScan(page);
  await page.getByRole("button", { name: "Scan my page" }).click();
  await page.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await page.getByRole("button", { name: "Send me the full scan" }).click();
  await expect(page.getByRole("button", { name: "Sending your report…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Scan my page" })).toBeDisabled();
  expect(calls).toBe(1); release();
  await expect(page.getByRole("button", { name: "Report sent", exact: true })).toBeDisabled();
});
