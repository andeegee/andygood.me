import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  ["Explore strategic projects", "/work-with-me/content-messaging-conversion/", "Fix the thinking before you fix the copy."],
  ["Explore fractional strategy", "/work-with-me/fractional-content-ai-strategy/", "Senior content leadership without another full-time hire."],
  ["Explore AI-enabled content systems", "/work-with-me/ai-enabled-content-systems/", "AI won’t fix a broken content operation."],
];

test("ways to work links reach the three intended offers", async ({ page }) => {
  for (const [label, href, heading] of routes) {
    await page.goto("/work-with-me/");
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading, { ignoreCase: true });
  }
  await page.goto("/work-with-me/");
  await expect(page).toHaveTitle("Ways to Work | Andy Good");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Work with Senior Content & AI Strategist Andy Good on messaging and conversion strategy, fractional content leadership or AI-enabled content systems.");
  expect(await page.locator("main").innerText()).not.toMatch(/\[[A-Z][A-Z\s,&-]+\]/);
  await expect(page.getByRole("link", { name: "allmi", exact: true }).first()).toHaveAttribute("href", "https://allmi.online");
  await page.getByRole("link", { name: "Start a conversation", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test("ways to work responsive layout and accessibility", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "All requested widths are covered in one run.");
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work-with-me/");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("main li")).toHaveCount(22);
    for (const [label] of routes) await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`ways-${width}.png`), fullPage: true });
  }
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
