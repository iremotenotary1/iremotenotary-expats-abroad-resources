import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const errors = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);

const index = readFileSync(join(PUBLIC, "index.html"), "utf8");
const siteJs = readFileSync(join(PUBLIC, "site.js"), "utf8");

if (!index.includes(`id="feedwalls-widget"`)) {
  fail("iframe", "index.html must include #feedwalls-widget iframe");
}

if (/groupID=95969471/.test(index)) fail("p8-group", "Must not embed Property #8 Group 95969471");
if (/groupID=95969472/.test(index)) fail("p9-group", "Must not embed Property #9 Group 95969472");
if (/groupID=95969447/.test(index)) fail("fw003-group", "Must not embed FW-003 Group 95969447");
if (/widgetID=180\b|Widget\s*180/i.test(index)) fail("p8-widget", "Must not reference Property #8 Widget 180");
if (/widgetID=181\b|Widget\s*181/i.test(index)) fail("p9-widget", "Must not reference Property #9 Widget 181");
if (/widgetID=150\b|Widget\s*150/i.test(index)) fail("fw003-widget", "Must not reference FW-003 Widget 150");

const pending = /data-fw-pending=["']true["']/i.test(index) || /FEEDWALLS_PENDING/i.test(index);
const srcMatch = index.match(
  /id="feedwalls-widget"[^>]*src="([^"]+)"|src="([^"]+)"[^>]*id="feedwalls-widget"/,
);
const src = (srcMatch && (srcMatch[1] || srcMatch[2])) || "";

if (pending) {
  if (src && /groupID=\d+/.test(src)) {
    fail("pending-live", "PENDING mode must not include a live groupID embed yet");
  }
  if (!siteJs.includes("https://feedwalls.online")) {
    fail("origin", "site.js must allowlist feedwalls.online even before widget embed");
  }
  if (!/feedwalls:height/.test(siteJs)) {
    fail("height-msg", "site.js must handle feedwalls:height postMessage");
  }
  if (/event\.origin\s*===?\s*['"]\*['"]|allowedOrigins\.add\(['"]\*['"]\)/.test(siteJs)) {
    fail("wildcard", "site.js must not accept wildcard message origins");
  }
  if (errors.length) {
    console.error(`validate-feedwalls: FAIL (${errors.length})`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("validate-feedwalls: PASS (PENDING — Group/Widget not created yet)");
  process.exit(0);
}

if (!src) fail("src", "Could not parse feedwalls-widget src");
if (!src.includes("feedwalls.online")) fail("host", "Embed host must be feedwalls.online");
if (!/titles_description\.php/.test(src)) fail("type", "Embed must use titles_description.php");
if (!/groupID=\d+/.test(src)) fail("group", "Live embed must include groupID");
if (!/displayItems=15/.test(src)) fail("display", "displayItems should be 15");
if (!/skin=list/.test(src)) fail("skin", "skin should be list");
if (!/dark=auto/.test(src)) fail("dark", "dark should be auto");
if (!/radius=8/.test(src)) fail("radius", "radius should be 8");
if (!/loading="lazy"/.test(index)) fail("lazy", "iframe should use loading=lazy");
if (!/referrerpolicy="strict-origin-when-cross-origin"/.test(index)) {
  fail("referrer", "iframe should use strict-origin-when-cross-origin");
}
if (!siteJs.includes("https://feedwalls.online")) fail("origin", "site.js must allowlist feedwalls.online");
if (/event\.origin\s*===?\s*['"]\*['"]|allowedOrigins\.add\(['"]\*['"]\)/.test(siteJs)) {
  fail("wildcard", "site.js must not accept wildcard message origins");
}
if (!/feedwalls:height/.test(siteJs)) fail("height-msg", "site.js must handle feedwalls:height postMessage");

if (errors.length) {
  console.error(`validate-feedwalls: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("validate-feedwalls: PASS (live embed)");
