import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const offers = [
  { slug: "content-messaging-conversion", title: "Content, Messaging & Conversion Strategy", heading: "Fix the thinking before you fix the copy.", description: "Senior content, messaging and conversion strategy for SaaS, technology and growth businesses facing an important positioning, website, campaign or conversion problem.", sections: 8, links: ["/work/", "/work-with-me/fractional-content-ai-strategy/", "/work-with-me/ai-enabled-content-systems/"] },
  { slug: "fractional-content-ai-strategy", title: "Fractional Content & AI Strategy", heading: "Senior content leadership without another full-time hire.", description: "Ongoing senior content and AI strategy for businesses that need stronger direction, judgement and content leadership without a full-time senior hire.", sections: 8, links: ["/work-with-me/ai-enabled-content-systems/"] },
  { slug: "ai-enabled-content-systems", title: "AI-Enabled Content Systems", heading: "AI won’t fix a broken content operation.", description: "Audit and improve the workflows, knowledge, research, review and AI-enabled systems behind your content operation.", sections: 10, links: ["/work-with-me/fractional-content-ai-strategy/", "https://allmi.online"] },
];

for (const offer of offers) {
  const path = `/work-with-me/${offer.slug}/`;
  test(`${offer.slug} metadata, complete content and link journeys`, async ({ page }) => {
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page).toHaveTitle(`${offer.title} | Andy Good`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(offer.heading);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", offer.description);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
    await expect(page.locator("main section")).toHaveCount(offer.sections);
    expect(await page.locator("main").innerText()).not.toMatch(/\[[A-Z][A-Z\s,&-]+\]/);
    for (const href of ["/work-with-me/", ...offer.links]) {
      const link = page.locator(`main a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      if (href.startsWith("/")) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
        await expect(page.locator("main h1")).toBeVisible();
        await page.goto(path);
      }
    }
    const ctas = page.getByRole("link", { name: "Start a conversation", exact: true });
    await expect(ctas).toHaveCount(2);
    for (const position of [0, 1]) {
      await ctas.nth(position).click();
      await expect(page).toHaveURL(/\/contact\/$/);
      await page.goto(path);
    }
  });

  test(`${offer.slug} responsive and accessible at all requested widths`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "All widths covered in the desktop run.");
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`page-${width}.png`), fullPage: true });
      await page.locator("main section").first().screenshot({ path: info.outputPath(`hero-${width}.png`) });
      await page.locator("main section").nth(3).screenshot({ path: info.outputPath(`detail-${width}.png`) });
    }
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
