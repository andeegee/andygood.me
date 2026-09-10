import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture } from "./briefing-fixture";

async function fill(page: import("@playwright/test").Page) {
  await page.goto("/lab/content-briefing");
  for (const key of ["topic", "audience", "objective", "cta"] as const) await page.locator(`#${key}`).fill(fixture.assignment[key]);
  await page.locator("#contentType").selectOption("Article");
  await page.locator("#funnelStage").selectOption("Consideration");
}

test("briefing layout, indexing and form accessibility", async ({ page, request }, info) => {
  await page.goto("/lab/content-briefing");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('nav a[href*="content-briefing"]')).toHaveCount(0);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("content-briefing");
  await page.getByRole("button", { name: "Generate draft brief" }).click();
  expect(await page.locator("#topic").evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("briefing-form.png"), fullPage: true });
});

test("complete pasted-source workflow, evidence, tabs and Markdown export", async ({ page }, info) => {
  await page.route("**/api/content-briefing", async (route) => {
    expect(route.request().postDataJSON().sourceText).toBe(fixture.assignment.sourceText);
    await route.fulfill({ json: fixture });
  });
  await fill(page);
  await page.locator("#sourceText").fill(fixture.assignment.sourceText);
  await page.getByRole("button", { name: "Generate draft brief" }).click();
  await expect(page.getByText("AI draft · Human review required", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Search / discoverability" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(page.getByText("F1 · Source-supported", { exact: true })).toBeVisible();
  await expect(page.getByText("F2 · Inference", { exact: true })).toBeVisible();
  await expect(page.locator("blockquote")).toContainText("The pilot involved 12 teams over six weeks.");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("briefing-evidence.png"), fullPage: true });
  await page.getByRole("tab", { name: "Evidence", exact: true }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Gaps & decisions/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Conversion impact was not measured.", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("content-brief.md");
  const stream = await file.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const markdown = Buffer.concat(chunks).toString("utf8");
  expect(markdown).toContain("## Evidence and findings"); expect(markdown).toContain("## Gaps & decisions"); expect(markdown).toContain("User-supplied source material");
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { copied: string }).copied = text; } } }); });
  await page.getByRole("button", { name: "Copy Markdown" }).click();
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(markdown);
  await page.getByRole("tab", { name: "Brief", exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("briefing-result.png"), fullPage: true });
  await page.locator("#topic").fill("Changed assignment");
  await expect(page.getByText(/This draft belongs to the previous submission/)).toBeVisible();
});

test("URL-only submissions, source warnings, errors and empty sources", async ({ page }) => {
  await fill(page);
  await page.getByRole("button", { name: "Generate draft brief" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Add pasted source text");
  await page.locator("#urls").fill("https://example.com/one\nhttps://example.com/two");
  await page.route("**/api/content-briefing", (route) => {
    expect(route.request().postDataJSON().urls).toHaveLength(2);
    return route.fulfill({ status: 502, json: { error: "The model provider could not complete the request." } });
  });
  await page.getByRole("button", { name: "Generate draft brief" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("The model provider");
  await expect(page.locator("#topic")).toHaveValue(fixture.assignment.topic);
  await page.unroute("**/api/content-briefing");
  await page.route("**/api/content-briefing", (route) => route.fulfill({ json: { ...fixture, sources: [{ id: "S1", label: "Source one", url: "https://example.com/one" }, { id: "S2", label: "Source two", url: "https://example.com/two", warning: "Page unavailable." }] } }));
  await page.getByRole("button", { name: "Generate draft brief" }).click();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(page.getByText("Page unavailable.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "https://example.com/one", exact: true })).toHaveAttribute("href", "https://example.com/one");
});

test("API rejects invalid input and does not cache responses", async ({ request }) => {
  const response = await request.post("/api/content-briefing", { data: {} });
  expect(response.status()).toBe(400);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  expect((await request.post("/api/content-briefing", { data: fixture.assignment, headers: { origin: "https://untrusted.example" } })).status()).toBe(403);
  expect((await request.post("/api/content-briefing", { data: { ...fixture.assignment, sourceText: "x".repeat(250000) } })).status()).toBe(413);
});
