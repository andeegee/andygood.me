import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { calculateResult, questions, type Answers } from "../../src/lib/content-workflow-diagnostic/config";

const answers = (score: number) => Object.fromEntries(questions.map(({ id }) => [id, score])) as Answers;

async function answerVisibleGroups(page: Page, option = 0) {
  for (const group of await page.locator("[data-question]").all()) await group.locator('input[type="radio"]').nth(option).check();
}

test("diagnostic preserves answers through browser history and unlocks the full report", async ({ page }, testInfo) => {
  await page.goto("/lab/content-workflow-diagnostic/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How well does your content operation actually work?");
  await expect(page.locator('#primary-navigation a[href="/ai-lab/"]')).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Takes around 4 minutes. See your initial result before entering your email.")).toBeVisible();
  await page.getByRole("button", { name: "Start the diagnostic", exact: true }).click();
  await answerVisibleGroups(page, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await answerVisibleGroups(page, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Knowledge");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Strategy");
  await expect(page.locator("[data-question] input:checked")).toHaveCount(3);
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Knowledge");
  for (let step = 3; step <= 6; step++) {
    await answerVisibleGroups(page, 0);
    await page.getByRole("button", { name: step === 6 ? "See my result" : "Continue" }).click();
  }
  await expect(page.getByText("Your initial result")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("0/100");
  await expect(page.getByText("Reactive", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Knowledge", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Get your full diagnostic" })).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();

  const result = calculateResult(answers(0));
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/content-workflow-diagnostic/", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { submitted: true, result } });
  });
  await page.getByLabel("Work email").fill("leader@example.com");
  await page.getByLabel(/Company or website/).fill("example.com");
  await page.getByRole("button", { name: "Show me the full diagnostic" }).click();
  await expect(page.getByRole("heading", { name: "Your complete five-part assessment" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("sent to your email");
  await expect(page.getByRole("heading", { name: "Three priority improvements" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Relevant AI opportunities" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Risk flags" }).locator("..").locator("article")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Talk through my content system" })).toHaveAttribute("href", "/contact/");
  expect(submitted).toMatchObject({ email: "leader@example.com", company: "example.com", role: "Founder / CEO", teamSize: "Just me", monthlyOutput: "1–5 pieces", answers: answers(0) });
  expect(submitted).not.toHaveProperty("commercialFit");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("content-workflow-diagnostic.png"), fullPage: true });
});

test("diagnostic has no horizontal overflow on narrow mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/lab/content-workflow-diagnostic/");
  await page.getByRole("button", { name: "Start the diagnostic", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
