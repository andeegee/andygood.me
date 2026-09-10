import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("work page content, artwork and contact journey", async ({ page, request }) => {
  await page.goto("/work/");
  await expect(page).toHaveTitle("Work | Andy Good");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Selected strategy, copy, conversion, SaaS, technology and AI work by Senior Content & AI Strategist Andy Good.");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/placeholder|\bDurable\b|\bBITA\b|Net Hub|Cleanse Force|PRN Hygiene|—/i);
  for (const name of ["Glasshouse", "Datasaur", "Ramp", "Dreamscape Tents", "Moxie", "Datch", "Orbital Witness", "Compassionate Inquiry", "The Wood Cave"]) expect(text).toContain(name);
  const images = page.locator("main img");
  await expect(images).toHaveCount(5);
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute("alt", /\S+/);
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect(await img.getAttribute("srcset")).toBeTruthy();
    const response = await request.get((await img.getAttribute("src"))!);
    expect(response.ok()).toBe(true);
  }
  const links = await page.locator('a[href^="/"]').evaluateAll(els => [...new Set(els.map(el => el.getAttribute("href")!))]);
  for (const href of links) expect((await request.get(href)).ok()).toBe(true);
  await page.getByRole("link", { name: "Start a conversation", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test("work layouts and accessibility at requested widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "All five viewports checked in desktop project");
  test.setTimeout(120000);
  await page.goto("/work/");
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    for (const img of await page.locator("main img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`work-${width}.png`), fullPage: true });
  }
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
