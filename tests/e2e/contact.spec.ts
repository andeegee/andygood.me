import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { contactTopics } from "../../src/lib/contact";

test("contact metadata, links, five widths and accessibility", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "All widths checked in desktop project");
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/contact/");
  await expect(page).toHaveTitle("Contact Andy Good | Content & AI Strategy");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Contact Senior Content & AI Strategist Andy Good about content strategy, messaging, conversion, fractional strategy, AI-enabled content systems or senior copywriting.");
  await expect(page.getByRole("link", { name: "letschat@andygood.me", exact: true })).toHaveAttribute("href", "mailto:letschat@andygood.me");
  await expect(page.getByRole("link", { name: "Visit allmi" })).toHaveAttribute("href", "https://allmi.online");
  await expect(page.locator("select option")).toHaveText(["Select an option", ...contactTopics]);
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`contact-${width}.png`), fullPage: true });
  }
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("keyboard validation, loading, recoverable errors and success", async ({ page }) => {
  await page.goto("/contact/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Name (required)", { exact: true })).toBeFocused();
  expect(await page.locator("#name").evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(page.locator("#name")).toBeFocused();
  await expect(page.locator("#name")).toHaveAttribute("aria-describedby", "name-error");
  await expect(page.locator("#name-error")).toHaveText("Enter your name.");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.type("Test Prospect");
  await page.keyboard.press("Tab");
  await page.keyboard.type("invalid");
  await page.keyboard.press("Enter");
  await expect(page.locator("#email")).toBeFocused();
  await expect(page.locator("#email-error")).toHaveText("Enter a valid email address.");
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("prospect@example.com");
  await page.keyboard.press("Tab");
  await expect(page.locator("#company")).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(page.locator("#message")).toBeFocused();
  await page.keyboard.type("We need clearer messaging for our next launch.");
  await expect(page.locator("#message")).toHaveAttribute("maxlength", "5000");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Send message" })).toBeFocused();
  const requests: Record<string, unknown>[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/contact/", async (route) => {
    requests.push(route.request().postDataJSON());
    await gate;
    await route.fulfill({ status: 502, json: { error: "Sending could not be confirmed. Your message is still here." } });
  });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Sending…", exact: true })).toBeDisabled();
  await expect(page.getByRole("form")).toHaveAttribute("aria-busy", "true");
  release();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("Your message is still here");
  await expect(page.locator("#message")).toHaveValue("We need clearer messaging for our next launch.");
  await page.unroute("**/api/contact/");
  await page.route("**/api/contact/", (route) => route.fulfill({ status: 400, json: { error: "Check the highlighted fields.", errors: { email: "Enter a valid email address." } } }));
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#email")).toBeFocused();
  await page.unroute("**/api/contact/");
  await page.route("**/api/contact/", async (route) => { requests.push(route.request().postDataJSON()); await route.fulfill({ json: { sent: true } }); });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message sent." })).toBeVisible();
  await expect(page.getByText("Thanks. I’ll take a look and get back to you as soon as I can.")).toBeVisible();
  await expect(page.getByRole("form")).toHaveCount(0);
  expect(requests[0]).toEqual(requests[1]);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("network failure retains the message", async ({ page }) => {
  await page.goto("/contact/");
  await page.locator("#name").fill("Test Prospect");
  await page.locator("#email").fill("prospect@example.com");
  await page.locator("#topic").selectOption(contactTopics[4]);
  await page.locator("#message").fill("Please help with our content.");
  await page.route("**/api/contact/", (route) => route.abort());
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("email letschat@andygood.me");
  await expect(page.locator("#message")).toHaveValue("Please help with our content.");
});
