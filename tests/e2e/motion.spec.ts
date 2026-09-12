import { expect, test } from "@playwright/test";

test("reveals substantial content without targeting heroes or controls", async ({ page }, testInfo) => {
  await page.goto("/about/");
  const target = page.locator("[data-reveal-group]").last();
  const item = target.locator(":scope > *").first();

  await expect(page.locator(".hero[data-reveal], .hero[data-reveal-group], nav[data-reveal], button[data-reveal], form[data-reveal]")).toHaveCount(0);
  await expect(item).toHaveCSS("opacity", "0");
  await expect(item).toHaveCSS("transform", testInfo.project.name === "mobile" ? "matrix(1, 0, 0, 1, 0, 16)" : "matrix(1, 0, 0, 1, 0, 18)");
  await target.scrollIntoViewIfNeeded();
  await expect(target).toHaveClass(/is-revealed/);
  await expect(item).toHaveCSS("opacity", "1");
});

test("shows content immediately when motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about/");
  const item = page.locator("[data-reveal-group] > *").first();

  await expect(page.locator("html")).not.toHaveClass(/motion-ready/);
  await expect(item).toHaveCSS("opacity", "1");
  await expect(item).toHaveCSS("transform", "none");
});

test("keeps content visible without IntersectionObserver", async ({ page }) => {
  await page.addInitScript(() => { delete (window as Window & { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver; });
  await page.goto("/about/");

  await expect(page.locator("html")).not.toHaveClass(/motion-ready/);
  await expect(page.locator("[data-reveal-group] > *").first()).toHaveCSS("opacity", "1");
});

test("activates the Lab glow only for a fine pointer", async ({ page }, testInfo) => {
  await page.goto("/ai-lab/");
  const lab = page.locator("main section[data-cursor-glow]");
  await expect(lab).toHaveCount(1);

  const box = await lab.boundingBox();
  if (!box) throw new Error("AI Lab glow section is not visible");
  await page.mouse.move(box.x + 120, box.y + 120);

  if (testInfo.project.name === "mobile") {
    await expect(lab).not.toHaveClass(/is-cursor-active/);
  } else {
    await expect(lab).toHaveClass(/is-cursor-active/);
    await page.waitForTimeout(750);
    await expect(lab).not.toHaveClass(/is-cursor-active/);
  }
});
