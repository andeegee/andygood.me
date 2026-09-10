import { lookup } from "node:dns/promises";
import https from "node:https";
import http from "node:http";
import ipaddr from "ipaddr.js";
import { load } from "cheerio";
import type { Assignment, Source } from "./schema";

export function isPublicAddress(address: string) {
  try { return ipaddr.process(address).range() === "unicast"; } catch { return false; }
}

export async function fetchPage(raw: string, signal: AbortSignal, redirects = 0): Promise<{ body: string; type: string; url: string }> {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("Only standard public HTTP(S) URLs are supported.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  signal.throwIfAborted();
  let onAbort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
  });
  const addresses = await Promise.race([lookup(host, { all: true }), cancelled]).finally(() => signal.removeEventListener("abort", onAbort));
  signal.throwIfAborted();
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address))) throw new Error("This URL does not resolve to a public address.");
  // Pin the validated address to the socket, preventing a second DNS lookup/rebinding.
  const address = addresses[0];
  const response = await new Promise<{ body: string; type: string; location?: string; status: number }>((resolve, reject) => {
    const req = (url.protocol === "https:" ? https : http).get(url, {
      signal, family: address.family, headers: { "User-Agent": "AndyGood-ContentBriefing/1.0", Accept: "text/html,text/plain", "Accept-Encoding": "identity" },
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
    }, (res) => {
      const status = res.statusCode ?? 500;
      if (status >= 300 && status < 400 && res.headers.location) { res.destroy(); resolve({ body: "", type: "", location: res.headers.location, status }); return; }
      const type = res.headers["content-type"] ?? "";
      if (status < 200 || status >= 300 || !/text\/(html|plain)|application\/xhtml\+xml/i.test(type)) { res.destroy(); reject(new Error("Page unavailable or unsupported format. Use pasted text for PDFs or restricted pages.")); return; }
      let size = 0;
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => { size += chunk.length; if (size > 2000000) { res.destroy(new Error("Page exceeds the 2 MB limit. Paste a relevant excerpt.")); } else chunks.push(chunk); });
      res.on("error", reject);
      res.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf8"), type, status }));
    });
    req.on("error", reject);
  });
  if (response.location) { if (redirects >= 3) throw new Error("Too many redirects."); return fetchPage(new URL(response.location, url).href, signal, redirects + 1); }
  return { ...response, url: url.href };
}

export async function collectSources(assignment: Assignment, fetcher = fetchPage): Promise<Source[]> {
  const sources: Source[] = assignment.sourceText ? [{ id: "S1", label: "User-supplied source material", text: assignment.sourceText }] : [];
  const offset = sources.length;
  const pages = await Promise.all(assignment.urls.map(async (url, index): Promise<Source> => {
    const id = `S${offset + index + 1}`;
    try {
      const page = await fetcher(url, AbortSignal.timeout(12000));
      const $ = load(page.body);
      $("script,style,noscript,nav,header,footer,svg,form,template").remove();
      $("br").replaceWith("\n");
      $("p,li,h1,h2,h3,h4,h5,h6,div,section,tr").append("\n");
      const root = $("main,article").first();
      const rawText = page.type.includes("text/plain") ? page.body : (root.length ? root : $("body")).text();
      const text = rawText.replace(/\s+/g, " ").trim();
      if (text.length < 40) throw new Error("No usable page text. The page may require JavaScript or sign-in; paste its text instead.");
      return { id, url: page.url, label: $("title").text().trim().slice(0, 200) || page.url, text: text.slice(0, 20000), ...(text.length > 20000 ? { warning: "Only the first 20,000 characters were analysed. Review omitted material." } : {}) };
    } catch (error) { return { id, label: url, url, text: "", warning: error instanceof Error && error.name !== "AbortError" ? error.message : "Source timed out. Paste the relevant text instead." }; }
  }));
  return [...sources, ...pages];
}
