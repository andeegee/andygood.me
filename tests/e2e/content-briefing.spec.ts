import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture } from "./briefing-fixture";
import { selectSummary, summaryMarkdown } from "../../src/app/ai-lab/content-briefing/summary";

async function fill(page: import("@playwright/test").Page) {
  await page.goto("/ai-lab/content-briefing");
  for (const key of ["topic", "audience", "objective", "cta"] as const) await page.locator(`#${key}`).fill(fixture.assignment[key]);
  await page.locator("#contentType").selectOption("Article");
  await page.locator("#funnelStage").selectOption("Consideration");
}

test("briefing layout, indexing and form accessibility", async ({ page, request }, info) => {
  await page.goto("/ai-lab/content-briefing");
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
  await expect(page.getByRole("tab", { name: "Summary", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab")).toHaveText(["Summary", "Full brief", "Evidence", "Gaps & decisions (3)"]);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("briefing-summary.png"), fullPage: true });
  await page.getByRole("tab", { name: "Summary", exact: true }).press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /Gaps & decisions/ })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Summary", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: /Gaps & decisions/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "Summary", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Search / discoverability" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(page.getByText("F1 · Source-supported", { exact: true })).toBeVisible();
  await expect(page.getByText("F2 · Inference", { exact: true })).toBeVisible();
  await expect(page.locator("blockquote")).toContainText("The pilot involved 12 teams over six weeks.");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("briefing-evidence.png"), fullPage: true });
  await page.getByRole("tab", { name: "Evidence", exact: true }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Gaps & decisions/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByText("Conversion impact was not measured.", { exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: "Copy summary", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(summaryMarkdown(fixture));
  await page.getByRole("tab", { name: "Full brief", exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("briefing-result.png"), fullPage: true });
  await page.locator("#topic").fill("Changed assignment");
  await expect(page.getByText(/This draft belongs to the previous submission/)).toBeVisible();
});

test("summary selection retains full data, caps lists and excludes unsupported proof", () => {
  const result = structuredClone(fixture);
  result.brief.requirements.questions = Array.from({ length: 12 }, (_, i) => `Question ${i}`);
  result.brief.requirements.outline = Array.from({ length: 12 }, (_, i) => `Section ${i}`);
  result.analysis.findings.push(...Array.from({ length: 7 }, (_, i) => ({ ...structuredClone(fixture.analysis.findings[0]), id: `F${i + 4}`, finding: `Proof ${i}` })));
  result.brief.requirements.evidenceIds = ["F8", "F3", "F1"];
  result.analysis.gaps.push({ kind: "Contradiction", detail: "Conflicting dates.", nextStep: "Confirm dates." });
  result.brief.search = { intent: "Informational", questions: ["Search question"], entities: ["Topic"], answerConsiderations: ["Answer the question directly."] };
  const before = JSON.stringify(result);
  const selected = selectSummary(result);
  expect(selected.priorities).toHaveLength(5);
  expect(new Set(selected.priorities.map((p) => p.label)).size).toBe(3);
  expect(selected.evidence).toHaveLength(5);
  expect(selected.evidence[0].id).toBe("F8");
  expect(selected.evidence.every((f) => f.classification === "Source-supported")).toBe(true);
  expect(selected.gaps).toHaveLength(3);
  expect(selected.gaps.map((g) => g.kind)).toEqual(["Contradiction", "Human decision", "Missing evidence"]);
  expect(selected.outline).toHaveLength(8);
  expect(selected.outline.at(-1)).toBe("Section 11");
  expect(selected.search).toBeNull();
  expect(JSON.stringify(result)).toBe(before);
  expect(selectSummary({ ...result, assignment: { ...result.assignment, query: "onboarding" } }).search?.Intent).toBe("Informational");
});

test("long summary passages expand, search appears and narrow screens remain accessible", async ({ page }, info) => {
  const result = structuredClone(fixture);
  result.brief.direction.primaryAngle = "Explain the scope and limitations of the pilot. ".repeat(12) + "Final qualification retained.";
  result.assignment.query = "onboarding";
  result.brief.search = { intent: "Informational", questions: ["How does onboarding work?"], entities: ["Onboarding"], answerConsiderations: ["Answer clearly with attributed evidence."] };
  await page.route("**/api/content-briefing", (route) => route.fulfill({ json: result }));
  await fill(page);
  await page.locator("#sourceText").fill(result.assignment.sourceText);
  await page.getByRole("button", { name: "Generate draft brief" }).click();
  const panel = page.getByRole("tabpanel", { name: "Summary", exact: true });
  await expect(panel.getByRole("heading", { name: "Search / GEO" })).toBeVisible();
  const direction = panel.getByRole("region", { name: "Strategic direction summary" });
  await expect(direction.locator("details > p")).toBeHidden();
  await direction.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(direction.locator("details > p")).toHaveText(result.brief.direction.primaryAngle);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("tab", { name: "Full brief", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Full brief", exact: true })).toContainText(result.brief.direction.primaryAngle);
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
