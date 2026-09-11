import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("about metadata, portrait and contact journey", async ({ page, request }) => {
  await page.goto("/about/");
  await expect(page).toHaveTitle("About Andy Good | Senior Content & AI Strategist");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Meet Andy Good, a Senior Content & AI Strategist with 18+ years across copywriting, content, conversion, digital strategy and AI-enabled content systems.");
  const portrait = page.locator("main").getByRole("img", { name: "Andy Good", exact: true });
  await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect((await request.get((await portrait.getAttribute("src"))!)).ok()).toBe(true);
  await expect(page.getByRole("link", { name: "Visit allmi", exact: true })).toHaveAttribute("href", "https://allmi.online");
  expect(await page.locator("main").innerText()).not.toMatch(/\[ABOUT|—/);
  await page.getByRole("link", { name: "Start a conversation", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test("about responsive layouts and accessibility", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Five widths checked in desktop project");
  test.setTimeout(120000);
  await page.goto("/about/");
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const portrait = page.locator("main").getByRole("img", { name: "Andy Good", exact: true });
    await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const bounds = await portrait.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.width / bounds!.height).toBeCloseTo(1122 / 1402, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`about-${width}.png`), fullPage: true });
    await page.locator('section[aria-labelledby="about-title"]').screenshot({ path: testInfo.outputPath(`hero-${width}.png`) });
  }
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

