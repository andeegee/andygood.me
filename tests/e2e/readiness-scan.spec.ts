import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { report, scanResponse, token } from "./readiness-fixture";
import { privacyCopy, limitation } from "../../src/lib/ai-search-readiness/config";
import { renderReport, renderLead } from "../../src/lib/ai-search-readiness/email";

test("readiness form has approved copy, optional topic, native validation and accessible narrow layout", async ({ page }, info) => {
  await page.goto("/ai-search-readiness-scan/");
  await expect(page).toHaveTitle("AI Search Readiness Scan | Andy Good");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is this page ready for AI search?");
  await expect(page.getByText("Get an initial readiness score and your biggest weakness before entering your email.")).toBeVisible();
  await expect(page.getByLabel("Target topic or question")).not.toHaveAttribute("required");
  await page.getByRole("button", { name: "Run the scan", exact: true }).click();
  await expect(page.getByLabel("Page URL", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Work email")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("readiness-form.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("initial score is ungated, email submission unlocks immediately and failed delivery retries without losing report", async ({ page }, info) => {
  await page.route("**/api/ai-search-readiness-scan/", (route) => {
    expect(route.request().postDataJSON()).toEqual({ url: report.url, topic: "" });
    return route.fulfill({ json: scanResponse });
  });
  let unlocks = 0;
  await page.route("**/api/ai-search-readiness-scan/report/", (route) => {
    const data = route.request().postDataJSON();
    expect(data.token).toBe(token); expect(data.email).toBe("visitor@example.com"); expect(data.company).toBe("Example payroll");
    expect(data).not.toHaveProperty("subscribe");
    if (data.action === "status") return route.fulfill({ json: { status: unlocks === 1 ? "failed" : "sent" } });
    unlocks++; return route.fulfill({ json: { report, status: "pending" } });
  });
  await page.goto("/ai-search-readiness-scan/");
  await page.getByLabel("Page URL", { exact: true }).fill(report.url);
  await page.getByRole("button", { name: "Run the scan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Search Readiness", exact: true })).toBeFocused();
  await expect(page.getByText(`${report.score}`, { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Biggest opportunity: Evidence/ })).toBeVisible();
  await expect(page.getByText(privacyCopy)).toBeVisible();
  const rows = page.getByRole("article").locator("ul > li"); await expect(rows).toHaveCount(7);
  const yellowEdges = await rows.evaluateAll((items) => items.filter((item) => getComputedStyle(item).borderLeftColor === "rgb(255, 212, 0)").length);
  expect(yellowEdges).toBe(1);
  await expect(page.getByRole("heading", { name: "Top three priorities" })).toHaveCount(0);
  await expect(page.getByText("What was found:", { exact: true })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("readiness-preview-gate.png"), fullPage: true });
  await page.getByRole("button", { name: "Show me the full report" }).click();
  await expect(page.getByLabel("Work email")).toBeFocused(); expect(unlocks).toBe(0);
  await page.getByLabel("Work email").fill("visitor@example.com");
  await page.getByLabel("Company or website").fill("Example payroll");
  await page.getByRole("button", { name: "Show me the full report" }).click();
  await expect(page.getByRole("heading", { name: "Your full AI Search Readiness report", exact: true })).toBeFocused();
  await expect(page.getByRole("status")).toContainText("full report is unlocked");
  for (const title of ["Top three priorities", "Quick wins", "Strategic opportunities", "Important limitation"]) await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(page.getByText(limitation)).toBeVisible();
  await expect(page.getByText("What was found:", { exact: true })).toHaveCount(7);
  await expect(page.getByRole("link", { name: "Talk through my AI search strategy" })).toHaveAttribute("href", "/contact/");
  await expect(page.getByRole("button", { name: "Retry email delivery", exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Retry email delivery", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("report and the private notification have been sent", { timeout: 10000 });
  expect(unlocks).toBe(2);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("readiness-full-report.png"), fullPage: true });
  await page.getByRole("heading", { name: /^Entity & proposition clarity:/ }).locator("..").screenshot({ path: info.outputPath("readiness-factor-detail.png") });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("readiness-full-320.png"), fullPage: true });
  await page.getByRole("heading", { name: /^Entity & proposition clarity:/ }).locator("..").screenshot({ path: info.outputPath("readiness-factor-detail-320.png") });
});

test("loading prevents duplicates and cancellation or source failure leaves no fabricated score", async ({ page }) => {
  let release!: () => void, calls = 0;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/ai-search-readiness-scan/", async (route) => { calls++; await waiting; await route.fulfill({ json: scanResponse }).catch(() => {}); });
  await page.goto("/ai-search-readiness-scan/"); await page.getByLabel("Page URL", { exact: true }).fill(report.url);
  await page.getByRole("button", { name: "Run the scan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Reading the page");
  await expect(page.getByRole("button", { name: "Scanning your page...", exact: true })).toBeDisabled();
  expect(calls).toBe(1); await page.getByRole("button", { name: "Cancel scan" }).click(); release();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("cancelled");
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.unroute("**/api/ai-search-readiness-scan/");
  await page.route("**/api/ai-search-readiness-scan/", (route) => route.fulfill({ status: 422, json: { error: "Insufficient extractable content. Choose another public page." } }));
  await page.getByRole("button", { name: "Run the scan", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Insufficient");
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.unroute("**/api/ai-search-readiness-scan/");
  await page.route("**/api/ai-search-readiness-scan/", (route) => route.fulfill({ status: 502, contentType: "text/html", body: "<html>Internal gateway detail</html>" }));
  await page.getByRole("button", { name: "Run the scan", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("unreadable response");
  await expect(page.getByRole("main").getByRole("alert")).not.toContainText("gateway detail");
});

test("email gate failures keep preview and prevent duplicate submissions in flight", async ({ page }) => {
  await page.route("**/api/ai-search-readiness-scan/", (route) => route.fulfill({ json: scanResponse }));
  let release!: () => void, calls = 0;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/ai-search-readiness-scan/report/", async (route) => { calls++; await waiting; await route.fulfill({ status: 503, json: { error: "Report service temporarily unavailable. Please retry." } }); });
  await page.goto("/ai-search-readiness-scan/"); await page.getByLabel("Page URL", { exact: true }).fill(report.url);
  await page.getByRole("button", { name: "Run the scan", exact: true }).click();
  await page.getByLabel("Work email").fill("visitor@example.com"); await page.getByRole("button", { name: "Show me the full report" }).click();
  await expect(page.getByRole("button", { name: "Unlocking your report..." })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run the scan", exact: true })).toBeDisabled(); expect(calls).toBe(1); release();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  await expect(page.getByRole("heading", { name: "AI Search Readiness", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your full AI Search Readiness report", exact: true })).toHaveCount(0);
});

test("report and private lead email layouts remain readable on mobile", async ({ page }, info) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  for (const [label, email] of [["report", renderReport(report)], ["lead", renderLead(report, "visitor@example.com", "Example payroll")]] as const) {
    await page.setContent(email.html);
    for (const width of [320, 390, 800]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width); }
    await page.screenshot({ path: info.outputPath(`readiness-email-${label}.png`), fullPage: true });
  }
});
