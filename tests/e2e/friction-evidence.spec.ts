import { test, expect } from "@playwright/test";
import { analyse, checkReport } from "../../src/lib/friction-scan/analysis";
import { normaliseEvidence } from "../../src/lib/friction-scan/evidence";
import { report, scanInput, sourceText } from "./friction-fixture";

const validationMessage = "The scan could not validate its report and page evidence. Please try again.";
const page = { text: sourceText, url: scanInput.url, warnings: [] };
const modelResponse = (value: unknown) => Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] });
function invalidEvidence() {
  const value = structuredClone(report);
  value.fixFirst.quote = "We simplify payroll for expanding British businesses.";
  return value;
}

for (const [name, source, quote] of [
  ["apostrophes", "It’s the founders’ payroll service.", "It's the founders' payroll service."],
  ["quotation marks", "Choose “Book a demo” to continue.", 'Choose "Book a demo" to continue.'],
  ["en dash", "Payroll \u2013 built for growing teams.", "Payroll - built for growing teams."],
  ["em dash", "Payroll \u2014 built for growing teams.", "Payroll - built for growing teams."],
  ["Unicode hyphens", "A people\u2010first, cloud\u2011based service.", "A people-first, cloud-based service."],
  ["non-breaking spaces", "Payroll\u00a0for\u202fgrowing teams.", "Payroll for growing teams."],
  ["repeated whitespace", "Payroll\n\tfor   growing teams.", "Payroll for growing teams."],
  ["canonical Unicode and ellipsis", "The cafe\u0301 team… starts here.", "The café team... starts here."],
]) {
  test(`evidence accepts equivalent ${name} in either direction without changing displayed quotes`, () => {
    for (const [text, originalQuote] of [[source, quote], [quote, source]]) {
      const value = structuredClone(report);
      value.fixFirst.quote = originalQuote;
      const before = structuredClone(value);
      expect(checkReport(value, `${sourceText}\n${text}`)).toBe(value);
      expect(value).toEqual(before);
    }
  });
}

test("evidence rejects paraphrases, omissions, case changes and meaningful symbol changes", () => {
  expect(() => checkReport(invalidEvidence(), sourceText)).toThrow(validationMessage);
  for (const [text, quote] of [
    ["A useful payroll service for growing teams.", "A payroll service for growing teams."],
    ["Payroll for growing teams.", "payroll for growing teams."],
    ["The change is \u221210 percent.", "The change is -10 percent."],
    ["Measure 12\u2032 before proceeding.", "Measure 12' before proceeding."],
    ["Use x\u00b2 in the calculation.", "Use x2 in the calculation."],
    ["A useful payroll service.", "            "],
  ]) {
    const value = structuredClone(report); value.fixFirst.quote = quote;
    expect(() => checkReport(value, `${sourceText}\n${text}`)).toThrow(validationMessage);
  }
  expect(normaliseEvidence("one-two")).not.toBe(normaliseEvidence("one two"));
});

test.describe("model validation retry and private diagnostics", () => {
  let originalFetch: typeof fetch;
  let originalWarn: typeof console.warn;
  let env: NodeJS.ProcessEnv;
  let logs: unknown[][];
  test.beforeEach(() => {
    originalFetch = globalThis.fetch; originalWarn = console.warn; env = { ...process.env }; logs = [];
    process.env.FRICTION_SCAN_BASE_URL = "https://api.example.com/v1";
    process.env.FRICTION_SCAN_API_KEY = "test-secret";
    process.env.FRICTION_SCAN_MODEL = "test-model";
    console.warn = (...args: unknown[]) => { logs.push(args); };
  });
  test.afterEach(() => { globalThis.fetch = originalFetch; console.warn = originalWarn; process.env = env; });

  test("successful scans still make exactly one call with strict output and unchanged content", async () => {
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls++;
      const body = JSON.parse(String(init?.body));
      expect(body.response_format.json_schema.strict).toBe(true); expect(body.store).toBe(false);
      expect(body.messages).toHaveLength(2);
      expect(JSON.parse(body.messages[1].content)).toEqual({ input: scanInput, page });
      return modelResponse(report);
    };
    expect(await analyse(scanInput, page, new AbortController().signal)).toEqual(report);
    expect(calls).toBe(1); expect(logs).toEqual([]);
  });

  test("failed evidence retries once with explicit copy instructions and the same source/deadline", async () => {
    const calls: RequestInit[] = [];
    globalThis.fetch = async (_url, init) => { calls.push(init!); return modelResponse(calls.length === 1 ? invalidEvidence() : report); };
    expect(await analyse(scanInput, page, new AbortController().signal)).toEqual(report);
    expect(calls).toHaveLength(2);
    expect(calls[0].signal).toBe(calls[1].signal);
    const first = JSON.parse(String(calls[0].body)); const retry = JSON.parse(String(calls[1].body));
    expect(retry.messages[1].role).toBe("system");
    expect(retry.messages[1].content).toContain("failed source validation");
    expect(retry.messages[1].content).toContain("exact, short, contiguous quotation copied directly");
    expect(retry.messages.at(-1)).toEqual(first.messages.at(-1));
    expect(retry.response_format).toEqual(first.response_format);
    expect(JSON.stringify(retry)).not.toContain(invalidEvidence().fixFirst.quote);
    expect(logs).toEqual([["evidence_quote_failed"]]);
  });

  test("two failed quotations stop with the existing public error and safe reason codes only", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return modelResponse(invalidEvidence()); };
    await expect(analyse(scanInput, page, new AbortController().signal)).rejects.toThrow(validationMessage);
    expect(calls).toBe(2);
    expect(logs).toEqual([["evidence_quote_failed"], ["evidence_quote_failed"]]);
  });

  test("malformed JSON, invalid schema and incomplete responses log distinct codes and never retry", async () => {
    for (const [response, code] of [
      [new Response("bad provider JSON"), "malformed_json"],
      [Response.json({ choices: [{ finish_reason: "stop", message: { content: "not json" } }] }), "malformed_json"],
      [modelResponse({}), "schema_validation_failed"],
      [Response.json({ choices: [{ finish_reason: "length", message: { content: "{}" } }] }), "incomplete_model_response"],
      [Response.json({ choices: [{ finish_reason: "stop", message: { refusal: "private provider detail" } }] }), "incomplete_model_response"],
    ] as const) {
      let calls = 0; logs.length = 0;
      globalThis.fetch = async () => { calls++; return response.clone(); };
      await expect(analyse(scanInput, page, new AbortController().signal)).rejects.toThrow(validationMessage);
      expect(calls).toBe(1); expect(logs).toEqual([[code]]);
    }
  });

  test("provider rate limits and missing endpoint configuration do not retry", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response("private provider detail", { status: 429 }); };
    await expect(analyse(scanInput, page, new AbortController().signal)).rejects.toThrow("analysis service");
    expect(calls).toBe(1); expect(logs).toEqual([]);
    process.env.FRICTION_SCAN_BASE_URL = "http://invalid.example.com";
    await expect(analyse(scanInput, page, new AbortController().signal)).rejects.toThrow("not configured");
    expect(calls).toBe(1);
  });

  test("overlong reports still fail without a retry", async () => {
    const value = JSON.parse(JSON.stringify(report));
    const expand = (item: Record<string, unknown>) => {
      for (const [key, child] of Object.entries(item)) {
        if (key === "explanation") item[key] = "word ".repeat(250).trim();
        else if (child && typeof child === "object") expand(child as Record<string, unknown>);
      }
    };
    expand(value);
    let calls = 0;
    globalThis.fetch = async () => { calls++; return modelResponse(value); };
    await expect(analyse(scanInput, page, new AbortController().signal)).rejects.toThrow(validationMessage);
    expect(calls).toBe(1); expect(logs).toEqual([["report_length_exceeded"]]);
  });

  test("cancellation before, during or between attempts never starts another call", async () => {
    for (const timing of ["before", "during", "between"] as const) {
      const controller = new AbortController(); let calls = 0; logs.length = 0;
      if (timing === "before") controller.abort();
      globalThis.fetch = async () => { calls++; if (timing === "during") controller.abort(); return modelResponse(invalidEvidence()); };
      console.warn = (...args: unknown[]) => { logs.push(args); if (timing === "between") controller.abort(); };
      await expect(analyse(scanInput, page, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
      expect(calls).toBe(timing === "before" ? 0 : 1);
      expect(logs).toEqual(timing === "between" ? [["evidence_quote_failed"]] : []);
    }
  });
});
