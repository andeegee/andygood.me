import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { launchPaths, navigation, site } from "../../src/lib/site";

const paths = [...launchPaths, "/work/placeholder/", "/insights/placeholder/"];

for (const path of paths) {
  test(`${path} renders with accessible layout and metadata`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site.url}${path}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${site.url}${path}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toBe(await page.title());
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("navigation works with keyboard and touch", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const mobile = testInfo.project.name === "mobile";
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  if (mobile) {
    await expect(nav).toBeHidden();
    await menu.click();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
  }
  for (const item of navigation) {
    if (mobile) await menu.click();
    await nav.getByRole("link", { name: item.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${item.href}$`));
    if (mobile) {
      await expect(nav).toBeHidden();
      await menu.click();
    }
    await expect(nav.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("aria-current", "page");
    if (mobile) await page.getByRole("button", { name: "Close menu" }).click();
  }
});

test("narrow viewport and enlarged text remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/work-with-me/content-messaging-conversion/");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Main", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("sitemap, robots and unknown routes", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of launchPaths) expect(xml).toContain(`<loc>${site.url}${path}</loc>`);
  expect(xml).not.toContain("placeholder");
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  for (const path of ["/missing/", "/work/missing/", "/insights/missing/", "/work-with-me/missing/"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test("capture foundation layouts", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath("navigation.png"), fullPage: true });
  }
  await page.goto("/work-with-me/");
  await page.screenshot({ path: testInfo.outputPath("ways-to-work.png"), fullPage: true });
});
