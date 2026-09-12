import { test, expect, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture } from "./briefing-fixture";

async function prepare(page: Page) {
  await page.goto("/ai-lab/content-briefing");
  for (const key of ["topic", "audience", "objective", "cta", "sourceText"] as const) await page.locator(`#${key}`).fill(fixture.assignment[key]);
  await page.locator("#contentType").selectOption("Article");
  await page.locator("#funnelStage").selectOption("Consideration");
}

test("active progress cycles, blocks duplicates, completes and resets on the next request", async ({ page }, info) => {
  const pending: Route[] = [];
  await page.route("**/api/content-briefing", (route) => { pending.push(route); });
  await prepare(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  // Exercise the synchronous lock, not just the absence of an enabled button.
  await page.locator("form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect.poll(() => pending.length).toBe(1);
  const progress = page.getByRole("region", { name: "Generating draft", exact: true });
  await expect(progress).toBeFocused();
  await expect(progress.getByRole("status")).toHaveText("Reading source material");
  await expect(progress.getByRole("timer")).toHaveText("Working for 0s");
  await expect(page.locator("#topic")).toBeDisabled();
  await expect(progress.getByRole("button", { name: "Cancel", exact: true })).toBeEnabled();
  await expect(progress).toContainText("This can take up to three minutes.");
  await expect(progress).toContainText("They do not report exact processing stages.");
  const bar = progress.locator('[aria-hidden="true"] > span');
  expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).not.toBe("none");
  for (const message of ["Extracting evidence and proof", "Checking gaps and unsupported claims", "Building strategic direction", "Structuring the brief", "Preparing the final draft", "Reading source material"]) {
    await page.clock.runFor(8000);
    await expect(progress.getByRole("status")).toHaveText(message);
  }
  await expect(progress.getByRole("timer")).toHaveText("Working for 48s");
  await page.clock.resume();
  await expect(progress.getByRole("timer")).toHaveAttribute("aria-live", "off");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await progress.screenshot({ path: info.outputPath("generation-progress.png") });
  await pending[0].fulfill({ json: fixture });
  await expect(progress).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Generated content brief", exact: true })).toBeFocused();
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Summary", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Generate a new draft", exact: true }).click();
  await expect.poll(() => pending.length).toBe(2);
  await expect(progress.getByRole("timer")).toHaveText("Working for 0s");
  await expect(progress.getByRole("status")).toHaveText("Reading source material");
  await progress.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(progress).toHaveCount(0);
  await expect(page.locator("form").getByRole("alert")).toBeFocused();
  await pending[1].abort();
});

test("reduced motion, keyboard cancellation and provider failure leave no loading state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const pending: Route[] = [];
  await page.route("**/api/content-briefing", (route) => { pending.push(route); });
  await prepare(page);
  await page.getByRole("button", { name: "Generate draft brief", exact: true }).click();
  await expect.poll(() => pending.length).toBe(1);
  const progress = page.getByRole("region", { name: "Generating draft", exact: true });
  await expect(progress).toBeFocused();
  expect(await progress.locator('[aria-hidden="true"] > span').evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await page.keyboard.press("Tab");
  await expect(progress.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(progress).toHaveCount(0);
  const error = page.locator("form").getByRole("alert");
  await expect(error).toContainText("cancelled or timed out");
  await expect(error).toBeFocused();
  await expect(page.locator("#topic")).toBeEnabled();
  await expect(page.locator("#sourceText")).toHaveValue(fixture.assignment.sourceText);
  await pending[0].abort();
  await page.getByRole("button", { name: "Generate draft brief", exact: true }).click();
  await expect.poll(() => pending.length).toBe(2);
  await expect(error).toHaveCount(0);
  await pending[1].fulfill({ status: 502, json: { error: "The model provider could not complete the request." } });
  await expect(progress).toHaveCount(0);
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(error).toHaveText("The model provider could not complete the request.");
  await expect(error).toBeFocused();
  await expect(page.getByRole("button", { name: "Generate draft brief", exact: true })).toBeEnabled();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
