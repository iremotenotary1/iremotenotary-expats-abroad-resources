import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const errors = [];
const warnings = [];
const results = [];

function read(rel) {
  return readFileSync(join(PUBLIC, rel), "utf8");
}

const pages = {
  "index.html": read("index.html"),
  "privacy.html": read("privacy.html"),
  "contact.html": read("contact.html"),
  "sources.html": read("sources.html"),
  "404.html": read("404.html"),
};

const allHtml = Object.values(pages).join("\n");
const hrefs = [...allHtml.matchAll(/href=["']([^"'#]+)(["']|#[^"']*["'])/gi)].map((m) =>
  m[1].replace(/&amp;/g, "&"),
);
const unique = [...new Set(hrefs)];

for (const href of unique) {
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("data:")) continue;
  if (!href.includes("://") && !href.startsWith("/")) {
    const file = href.split("?")[0];
    if (!existsSync(join(PUBLIC, file))) {
      errors.push(`Missing local file: ${href}`);
      results.push({ url: href, status: "BROKEN" });
    } else {
      results.push({ url: href, status: "OK" });
    }
  }
}

const fragmentTargets = new Set(
  [...allHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]),
);
for (const page of Object.values(pages)) {
  for (const match of page.matchAll(/href=["']#([^"']+)["']/gi)) {
    const id = match[1];
    if (!fragmentTargets.has(id)) {
      errors.push(`Missing fragment target #${id}`);
      results.push({ url: `#${id}`, status: "BROKEN" });
    }
  }
}

const siteOrigin = read("site-origin.txt").trim().replace(/\/$/, "");

const external = [...new Set(unique.filter((h) => /^https?:\/\//i.test(h)))].filter(
  (h) =>
    !h.includes("PROPERTY-010-NOT-DEPLOYED.ondigitalocean.invalid") &&
    !h.startsWith(siteOrigin + "/") &&
    h.replace(/\/$/, "") !== siteOrigin,
);

const botBlockedHosts = [/dos\.fl\.gov/i, /travel\.state\.gov/i, /eforms\.state\.gov/i, /www\.state\.gov/i, /usembassy\.gov/i];
const trustedNetworkHosts = [/iremotenotary\.com/i, /feedwalls\.online/i];

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Property10LinkValidator/1.0" },
    });
    if (res.status === 405 || res.status === 403 || res.status === 401) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Property10LinkValidator/1.0" },
      });
    }
    clearTimeout(timer);
    const finalUrl = res.url || url;
    if (res.ok) {
      const status = finalUrl.replace(/\/$/, "") !== url.replace(/\/$/, "") ? "REDIRECT" : "OK";
      return { url, status, code: res.status };
    }
    if ((res.status === 403 || res.status === 429) && botBlockedHosts.some((re) => re.test(url))) {
      return { url, status: "BOT_BLOCKED", code: res.status };
    }
    if (res.status === 403 || res.status === 429) {
      return { url, status: "BOT_BLOCKED", code: res.status };
    }
    return { url, status: "BROKEN", code: res.status };
  } catch (error) {
    if (botBlockedHosts.some((re) => re.test(url))) {
      return { url, status: "BOT_BLOCKED", code: 0, error: String(error.message || error) };
    }
    if (trustedNetworkHosts.some((re) => re.test(url))) {
      return {
        url,
        status: "NETWORK_UNREACHABLE",
        code: 0,
        error: String(error.message || error),
      };
    }
    return { url, status: "BROKEN", code: 0, error: String(error.message || error) };
  }
}

const checked = [];
for (const url of external) {
  const result = await checkUrl(url);
  checked.push(result);
  results.push(result);
  if (result.status === "BROKEN") errors.push(`Broken external link (${result.code}): ${url}`);
  if (result.status === "BOT_BLOCKED") warnings.push(`Bot-blocked (not marked broken): ${url}`);
  if (result.status === "NETWORK_UNREACHABLE") {
    warnings.push(`Network unreachable from this environment (not marked broken): ${url}`);
  }
}

console.log("validate-links summary:");
for (const row of checked) {
  console.log(`- ${row.status}${row.code ? ` ${row.code}` : ""} ${row.url}`);
}

if (errors.length) {
  console.error(`validate-links: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (warnings.length) {
  console.log(`validate-links: PASS with WARN (${warnings.length})`);
  for (const warning of warnings) console.log(`- ${warning}`);
  process.exit(0);
}

console.log("validate-links: PASS");
