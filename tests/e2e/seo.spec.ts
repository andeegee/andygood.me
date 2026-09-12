import { expect, test } from "@playwright/test";
import { launchPaths, site } from "../../src/lib/site";

type Schema = { "@type"?: string; "@id"?: string; "@graph"?: Schema[]; [key: string]: unknown };

async function schemas(page: import("@playwright/test").Page) {
  const payloads = await page.locator('script[type="application/ld+json"]').allTextContents();
  return payloads.flatMap((payload) => {
    const schema = JSON.parse(payload) as Schema;
    return schema["@graph"] ?? [schema];
  });
}

test("publishes consistent entity, service and article structured data", async ({ page }) => {
  await page.goto("/");
  let data = await schemas(page);
  expect(data.find((item) => item["@type"] === "WebSite")).toMatchObject({ name: "Andy Good", inLanguage: "en-GB" });
  expect(data.find((item) => item["@type"] === "Person")).toMatchObject({ name: "Andy Good", jobTitle: "Senior Content & AI Strategist" });

  await page.goto("/work-with-me/fractional-content-ai-strategy/");
  data = await schemas(page);
  expect(data.find((item) => item["@type"] === "Service")).toMatchObject({
    name: "Fractional Content & AI Strategy",
    provider: { "@id": `${site.url}/#person` },
  });
  expect(data.find((item) => item["@type"] === "BreadcrumbList")).toBeTruthy();

  await page.goto("/insights/ai-seo-geo-aeo-2026/");
  data = await schemas(page);
  expect(data.find((item) => item["@type"] === "BlogPosting")).toMatchObject({
    author: { "@id": `${site.url}/#person` },
    datePublished: "2026-09-12",
    dateModified: "2026-09-12",
  });
  expect(data.find((item) => item["@type"] === "BreadcrumbList")).toBeTruthy();
});

test("all internal links resolve and canonical host redirects", async ({ page, request }) => {
  const hrefs = new Set<string>();
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of launchPaths) {
    await page.goto(path);
    titles.add(await page.title());
    descriptions.add((await page.locator('meta[name="description"]').getAttribute("content")) ?? "");
    for (const href of await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")!))) hrefs.add(href);
  }
  expect(titles.size).toBe(launchPaths.length);
  expect(descriptions.size).toBe(launchPaths.length);
  expect(descriptions).not.toContain("");
  for (const href of hrefs) expect.soft((await request.get(href)).status(), href).toBe(200);

  const duplicate = await request.get("/about/", { headers: { host: "www.andygood.me" }, maxRedirects: 0 });
  expect(duplicate.status()).toBe(308);
  expect(duplicate.headers().location).toBe("https://andygood.me/about/");
});
