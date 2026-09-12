import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("portrait scrubs with scroll and retains static fallbacks", async ({ page }, testInfo) => {
  await page.goto("/about/");
  const video = page.locator("main video");
  const portrait = page.locator("main").getByRole("img", { name: "Andy Good", exact: true });
  await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete)).toBe(true);
  const initialBounds = await portrait.boundingBox();
  if (testInfo.project.name === "mobile") {
    await expect(video).not.toHaveAttribute("src");
    await expect(video).toHaveCSS("opacity", "0");
    return;
  }

  await expect(video).toHaveAttribute("data-ready", "true");
  expect(await portrait.boundingBox()).toEqual(initialBounds);
  const media = await video.evaluate((v: HTMLVideoElement) => ({
    duration: v.duration, width: v.videoWidth, height: v.videoHeight,
    paused: v.paused, muted: v.muted, autoplay: v.autoplay, loop: v.loop,
  }));
  expect(media).toMatchObject({ paused: true, muted: true, autoplay: false, loop: false });
  expect(media.duration).toBeGreaterThanOrEqual(4.2);
  await testInfo.attach("video-metadata", { body: JSON.stringify(media), contentType: "application/json" });
  const end = await page.locator('section[aria-labelledby="about-title"]').evaluate((hero) => {
    const rect = hero.getBoundingClientRect();
    return rect.top + scrollY + rect.height * 0.5;
  });
  for (const progress of [0.5, 1, 0]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), end * progress);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.seeking ? -1 : v.currentTime)).toBeCloseTo(4.2 * progress, 1);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await page.locator('section[aria-labelledby="about-title"]').screenshot({ path: testInfo.outputPath(`handshake-${progress}.png`) });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).not.toHaveAttribute("src");
  await expect(video).toHaveCSS("opacity", "0");
  expect(await portrait.boundingBox()).toEqual(initialBounds);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(video).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 768, height: 1000 });
  await expect(video).toHaveCSS("opacity", "1");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(video).not.toHaveAttribute("src");
  await expect(video).toHaveCSS("opacity", "0");
});

test("portrait remains static while video loads and if loading fails", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  let failRequest!: () => void;
  const failed = new Promise<void>((resolve) => { failRequest = resolve; });
  await page.route("**/media/andy-about-handshake.mp4", async (route) => {
    await failed;
    await route.abort();
  });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const video = page.locator("main video");
  await expect(video).toHaveAttribute("src", "/media/andy-about-handshake.mp4");
  await expect(video).toHaveCSS("opacity", "0");
  await expect(page.locator("main").getByRole("img", { name: "Andy Good", exact: true })).toBeVisible();
  failRequest();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.error !== null)).toBe(true);
  await expect(video).toHaveCSS("opacity", "0");
});

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

