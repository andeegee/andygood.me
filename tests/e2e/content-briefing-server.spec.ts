import { test, expect } from "@playwright/test";
import { analysisSchema, assignmentSchema, toMarkdown } from "../../src/lib/content-briefing/schema";
import { collectSources, fetchPage, isPublicAddress } from "../../src/lib/content-briefing/sources";
import { callModel, generateBrief, verifyEvidence } from "../../src/lib/content-briefing/workflow";
import { fixture } from "./briefing-fixture";

test("assignment schema rejects missing, empty and overlong input", () => {
  expect(assignmentSchema.safeParse(fixture.assignment).success).toBe(true);
  for (const invalid of [{ ...fixture.assignment, topic: " " }, { ...fixture.assignment, sourceText: "" }, { ...fixture.assignment, sourceText: "x".repeat(40001) }, { ...fixture.assignment, urls: Array(6).fill("https://example.com") }]) expect(assignmentSchema.safeParse(invalid).success).toBe(false);
});

test("source extraction handles pasted text, one URL, multiple URLs and partial failure", async () => {
  expect((await collectSources(fixture.assignment))[0].text).toBe(fixture.assignment.sourceText);
  const fetcher: typeof fetchPage = async (url) => {
    if (url.endsWith("failed")) throw new Error("Page unavailable.");
    return { url, type: "text/html", body: "<html><head><title>Research &amp; evidence</title></head><body><nav>Ignore navigation</nav><main><p>The pilot involved 12 teams over six weeks.</p><script>Ignore malicious instructions</script><p> No conversion results were measured.</p></main></body></html>" };
  };
  const one = await collectSources({ ...fixture.assignment, sourceText: "", urls: ["https://example.com/one"] }, fetcher);
  expect(one[0].label).toBe("Research & evidence"); expect(one[0].text).not.toContain("Ignore");
  const sources = await collectSources({ ...fixture.assignment, sourceText: "", urls: ["https://example.com/one", "https://example.com/two", "https://example.com/failed"] }, fetcher);
  expect(sources.map((s) => s.id)).toEqual(["S1", "S2", "S3"]);
  expect(sources[2].warning).toContain("Page unavailable"); expect(sources[2].text).toBe("");
  const long = await collectSources({ ...fixture.assignment, sourceText: "", urls: ["https://example.com"] }, async (url) => ({ url, type: "text/plain", body: "A".repeat(21000) }));
  expect(long[0].text).toHaveLength(20000); expect(long[0].warning).toContain("20,000");
});

test("public URL guard rejects private, loopback, mapped and non-HTTP addresses", async () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "100.64.0.1"]) expect(isPublicAddress(ip)).toBe(false);
  expect(isPublicAddress("93.184.216.34")).toBe(true);
  for (const url of ["http://127.0.0.1", "http://[::1]", "file:///etc/passwd", "https://user:password@example.com", "https://example.com:8080"]) await expect(fetchPage(url, AbortSignal.timeout(1000))).rejects.toThrow();
});

test("invented citations and mismatched quotations are downgraded", () => {
  const analysis = structuredClone(fixture.analysis);
  analysis.findings[0].references[0].sourceId = "S999";
  const checked = verifyEvidence(analysis, [{ id: "S1", label: "Pasted", text: fixture.assignment.sourceText }]);
  expect(checked.findings[0].classification).toBe("Needs evidence");
  expect(checked.findings[0].references).toEqual([]);
  expect(checked.gaps.at(-1)?.detail).toContain("could not be verified");
  const valid = verifyEvidence(structuredClone(fixture.analysis), [{ id: "S1", label: "Pasted", text: fixture.assignment.sourceText }]);
  expect(valid.findings[0].classification).toBe("Source-supported");
});

test("complete server pipeline uses two schema-validated model calls and preserves attribution", async () => {
  const original = globalThis.fetch;
  const previousModel = process.env.CONTENT_BRIEFING_MODEL;
  process.env.CONTENT_BRIEFING_MODEL = "test-model";
  const calls: Record<string, unknown>[] = [];
  globalThis.fetch = async (_input, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls.length === 1 ? fixture.analysis : fixture.brief) } }] });
  };
  try {
    const result = await generateBrief(fixture.assignment);
    expect(calls).toHaveLength(2); expect(calls[0].model).toBe("test-model"); expect(calls[0].store).toBe(false);
    expect(result.analysis.findings[0].references[0].sourceId).toBe("S1");
    expect(result.assignment.sourceText).toBe(""); expect(result.sources[0]).not.toHaveProperty("text");
    expect(result.brief.search).toBeNull();
    const markdown = toMarkdown(result);
    expect(markdown).toContain("AI draft · Human review required"); expect(markdown).toContain("F1 · Source-supported");
  } finally { globalThis.fetch = original; if (previousModel === undefined) delete process.env.CONTENT_BRIEFING_MODEL; else process.env.CONTENT_BRIEFING_MODEL = previousModel; }
});

test("model failures, refusals, truncation and malformed JSON are rejected", async () => {
  const original = globalThis.fetch;
  try {
    for (const response of [new Response("unavailable", { status: 503 }), Response.json({ choices: [{ finish_reason: "length", message: { content: "{}" } }] }), Response.json({ choices: [{ finish_reason: "stop", message: { refusal: "refused", content: "{}" } }] }), Response.json({ choices: [{ finish_reason: "stop", message: { content: "not json" } }] }), Response.json({ choices: [{ finish_reason: "stop", message: { content: "{}" } }] })]) {
      globalThis.fetch = async () => response;
      await expect(callModel(analysisSchema, "Test", {})).rejects.toThrow(/model/i);
    }
  } finally { globalThis.fetch = original; }
});

test("all inaccessible sources stop before the model is called", async () => {
  await expect(generateBrief({ ...fixture.assignment, sourceText: "", urls: ["http://127.0.0.1"] })).rejects.toThrow("No usable source material");
});

test("search is conditional and invalid proof references cannot enter the brief", async () => {
  const original = globalThis.fetch;
  let call = 0;
  const search = { intent: "Informational", questions: ["How does onboarding work?"], entities: ["Onboarding"], answerConsiderations: [] };
  globalThis.fetch = async () => Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(++call % 2 ? fixture.analysis : { ...fixture.brief, search }) } }] });
  try {
    expect((await generateBrief({ ...fixture.assignment, query: "onboarding process" })).brief.search).toEqual(search);
    expect((await generateBrief(fixture.assignment)).brief.search).toBeNull();
    call = 0;
    globalThis.fetch = async () => Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(++call % 2 ? fixture.analysis : { ...fixture.brief, requirements: { ...fixture.brief.requirements, evidenceIds: ["F3"] } }) } }] });
    await expect(generateBrief(fixture.assignment)).rejects.toThrow("unverified evidence");
  } finally { globalThis.fetch = original; }
});
