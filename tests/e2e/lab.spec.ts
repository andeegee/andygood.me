import { test, expect } from "@playwright/test";

test("AI Lab showcases both tools at their existing routes", async ({ page }, testInfo) => {
  await page.goto("/ai-lab/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Practical Content + AI systems");
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("lab.png"), fullPage: true });
  await page.getByRole("link", { name: "Run the free scan", exact: true }).click();
  await expect(page).toHaveURL(/\/website-friction-scan\/$/);
  await expect(page.getByRole("button", { name: "Scan my page", exact: true })).toBeVisible();
  await page.goto("/ai-lab/");
  await page.getByRole("link", { name: "View the demo", exact: true }).click();
  await expect(page).toHaveURL(/\/ai-lab\/content-briefing\/$/);
  await expect(page.getByRole("button", { name: "Generate draft brief", exact: true })).toBeVisible();
  await page.goto("/ai-lab/");
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("old Lab routes redirect permanently", async ({ request }) => {
  for (const [from, to] of [["/lab/", "/ai-lab/"], ["/lab/content-briefing/", "/ai-lab/content-briefing/"]]) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(to);
  }
});
