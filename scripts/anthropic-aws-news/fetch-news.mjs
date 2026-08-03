#!/usr/bin/env node
// Polls AWS RSS feeds for Anthropic/Claude-related announcements and appends
// new matches to docs/anthropic-aws-tracker.md. Zero npm dependencies (uses
// Node's built-in fetch + a small regex-based RSS <item> parser) so it runs
// standalone without touching this monorepo's per-project package.json files.
//
// Usage: node scripts/anthropic-aws-news/fetch-news.mjs
// Exit code 0 always; sets GITHUB_OUTPUT `new_items=true` when it wrote anything.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const SEEN_PATH = path.join(__dirname, "seen-items.json");
const TRACKER_PATH = path.join(REPO_ROOT, "docs", "anthropic-aws-tracker.md");
const MAX_SEEN = 1000;

const FEEDS = [
  { name: "AWS What's New", url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/" },
  { name: "AWS News Blog", url: "https://aws.amazon.com/blogs/aws/feed/" },
  { name: "AWS Machine Learning Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/" },
];

// Matches Anthropic model names/brands and the Bedrock+Claude combination,
// not "claude" alone (too many false positives from unrelated Claude Shannon etc. mentions).
const KEYWORD_RE = /\b(anthropic|claude|sonnet-\d|opus-\d|haiku-\d|claude\s+(code|opus|sonnet|haiku|fable))\b/i;

function stripCdata(s) {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'");
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(stripCdata(m[1].trim())) : "";
}

function parseRss(xml, sourceName) {
  const items = [];
  for (const itemMatch of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = itemMatch[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link") || extractTag(block, "guid");
    const pubDate = extractTag(block, "pubDate");
    const description = extractTag(block, "description");
    if (!title || !link) continue;
    items.push({ source: sourceName, title, link, pubDate, description });
  }
  return items;
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, { headers: { "User-Agent": "anthropic-on-aws-news-tracker" } });
  if (!res.ok) {
    console.error(`[warn] ${feed.name}: HTTP ${res.status}`);
    return [];
  }
  const xml = await res.text();
  return parseRss(xml, feed.name);
}

function loadSeen() {
  if (!existsSync(SEEN_PATH)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(SEEN_PATH, "utf8")));
  } catch {
    return new Set();
  }
}

function saveSeen(seenSet) {
  const arr = [...seenSet].slice(-MAX_SEEN);
  writeFileSync(SEEN_PATH, JSON.stringify(arr, null, 2) + "\n");
}

function appendToTracker(newItems) {
  const header = "# Anthropic on AWS — news tracker\n\nAuto-updated by `.github/workflows/anthropic-aws-news-tracker.yml`. Newest first.\n";
  const existing = existsSync(TRACKER_PATH) ? readFileSync(TRACKER_PATH, "utf8") : header;
  const body = existing.startsWith("# ") ? existing : header;

  const dateStr = new Date().toISOString().slice(0, 10);
  const entries = newItems
    .map((it) => `- [${it.title}](${it.link}) — *${it.source}*${it.pubDate ? ` (${it.pubDate})` : ""}`)
    .join("\n");
  const section = `\n## ${dateStr}\n\n${entries}\n`;

  // Insert right after the header block (first blank line after intro).
  const splitAt = body.indexOf("\n\n") + 2;
  const updated = body.slice(0, splitAt) + section + body.slice(splitAt);
  writeFileSync(TRACKER_PATH, updated);
}

async function main() {
  const seen = loadSeen();
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const all = results.flat();

  const matched = all.filter((it) => KEYWORD_RE.test(it.title) || KEYWORD_RE.test(it.description));
  const fresh = matched.filter((it) => !seen.has(it.link));

  if (fresh.length === 0) {
    console.log("No new Anthropic/Claude-related items found.");
    if (process.env.GITHUB_OUTPUT) {
      writeFileSync(process.env.GITHUB_OUTPUT, "new_items=false\n", { flag: "a" });
    }
    return;
  }

  console.log(`Found ${fresh.length} new item(s):`);
  fresh.forEach((it) => console.log(`  - [${it.source}] ${it.title} — ${it.link}`));

  appendToTracker(fresh);
  fresh.forEach((it) => seen.add(it.link));
  saveSeen(seen);

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, "new_items=true\n", { flag: "a" });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
