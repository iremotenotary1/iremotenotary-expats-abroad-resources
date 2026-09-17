import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const productionMode = process.argv.includes("--production");
const errors = [];

function readPublic(relPath) {
  return readFileSync(join(PUBLIC, relPath), "utf8");
}

function readRoot(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function fail(id, message) {
  errors.push({ id, message });
}

const REQUIRED_PUBLIC = [
  "index.html",
  "privacy.html",
  "contact.html",
  "sources.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "styles.css",
  "site.js",
  "site-origin.txt",
  "data/sources.json",
  "data/expat-hubs.json",
];

const REQUIRED_ROOT = [
  "package.json",
  "README.md",
  ".do/app.yaml.template",
  "scripts/validate-site.mjs",
  "scripts/validate-geo.mjs",
  "scripts/validate-agent-readiness.mjs",
  "scripts/validate-links.mjs",
  "scripts/validate-contamination.mjs",
  "scripts/validate-feedwalls.mjs",
  "scripts/validate-expat-data.mjs",
];

for (const file of REQUIRED_PUBLIC) {
  if (!existsSync(join(PUBLIC, file))) fail("missing-file", `Required public file missing: ${file}`);
}
for (const file of REQUIRED_ROOT) {
  if (!existsSync(join(ROOT, file))) fail("missing-file", `Required file missing: ${file}`);
}

const index = readPublic("index.html");
const privacy = readPublic("privacy.html");
const contact = readPublic("contact.html");
const sources = readPublic("sources.html");
const notFound = readPublic("404.html");
const robots = readPublic("robots.txt");
const sitemap = readPublic("sitemap.xml");
const styles = readPublic("styles.css");
const siteJs = readPublic("site.js");
const siteOriginFile = readPublic("site-origin.txt").trim();
const sourcesJson = readPublic("data/sources.json");
const hubsJson = readPublic("data/expat-hubs.json");
const readme = readRoot("README.md");
const packageJson = readRoot("package.json");
const appTemplate = readRoot(".do/app.yaml.template");

const ORIGIN = siteOriginFile.replace(/\/$/, "");
const runtimeText = [index, privacy, contact, sources, notFound, robots, sitemap, styles, siteJs].join("\n");
const repoText = `${runtimeText}\n${readme}\n${siteOriginFile}\n${packageJson}\n${sourcesJson}\n${hubsJson}\n${appTemplate}`;

if (!/^https:\/\/[a-z0-9.-]+(\.[a-z0-9.-]+)+$/i.test(ORIGIN)) {
  fail("site-origin", "site-origin.txt must be an https origin (App Platform host or .invalid placeholder)");
}
if (!/ondigitalocean\.(app|invalid)/i.test(ORIGIN)) {
  fail("site-origin-family", "site-origin.txt must be ondigitalocean.app family (or .invalid placeholder)");
}

if (productionMode && /\.invalid/i.test(repoText)) {
  fail("production-placeholder", "PRODUCTION mode forbids .invalid production-origin placeholders");
}
if (productionMode && /localhost|127\.0\.0\.1/i.test(repoText)) {
  fail("production-localhost", "PRODUCTION mode forbids localhost references");
}

for (const page of [
  ["index.html", index],
  ["privacy.html", privacy],
  ["contact.html", contact],
  ["sources.html", sources],
]) {
  const [name, html] = page;
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) fail("h1", `${name} must have exactly one H1 (found ${h1Count})`);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail("title", `${name} missing <title>`);
  if (!/name=["']description["']/i.test(html)) fail("meta-description", `${name} missing meta description`);
  if (!/rel=["']canonical["']/i.test(html)) fail("canonical", `${name} missing canonical`);
  if (!html.includes(ORIGIN)) fail("canonical-origin", `${name} must use centralized origin ${ORIGIN}`);
}

if (!index.includes(`href="${ORIGIN}/"`) || /rel=["']canonical["'][^>]*index\.html/i.test(index)) {
  fail("canonical-index", "index.html canonical must point to ORIGIN/ (App Platform root), not /index.html");
}
if (!index.includes(`property="og:url" content="${ORIGIN}/"`)) fail("og-url", "index.html og:url must use centralized origin root /");

const ldMatches = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
if (!ldMatches.length) fail("schema", "index.html missing JSON-LD");
for (const block of ldMatches) {
  const json = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
  try {
    const parsed = JSON.parse(json);
    const blob = JSON.stringify(parsed);
    if (!/"name"\s*:\s*"iRemoteNotary"/.test(blob)) fail("organization", "JSON-LD must identify Organization name iRemoteNotary");
    if (!blob.includes("https://www.iremotenotary.com")) fail("organization-url", "JSON-LD must include organization URL");
  } catch (error) {
    fail("schema-parse", `JSON-LD parse failed: ${error.message}`);
  }
}

if (!/id="feedwalls-widget"/.test(index)) {
  fail("feedwalls-iframe", "index must include #feedwalls-widget iframe");
}
if (/groupID=95969471|groupID=95969472|groupID=95969447|widgetID=180\b|widgetID=181\b|Widget\s*180|Widget\s*181/i.test(index)) {
  fail("p8-p9-feedwalls", "Must not embed Property #8/#9/FW-003 FeedWalls Group or Widget IDs");
}
const pending = /data-fw-pending=["']true["']/i.test(index) || /FEEDWALLS_PENDING/i.test(index);
const liveEmbed = /feedwalls\.online\/app\/titles_description\.php\?groupID=\d+/.test(index);
if (!pending && !liveEmbed) {
  fail("feedwalls-marker", "index must embed a live FeedWalls group OR mark FEEDWALLS_PENDING");
}

if (!siteJs.includes("https://feedwalls.online")) fail("postmessage-origin", "site.js must validate feedwalls.online origin");

const banned = [
  ["localhost", /localhost/i],
  ["127.0.0.1", /127\.0\.0\.1/],
  ["amazonaws", /amazonaws\.com/i],
  ["spaces", /digitaloceanspaces\.com/i],
  ["gcs-origin", /storage\.googleapis\.com/i],
  ["p8-bucket", /iremotenotary-us-documents-signed-abroad/i],
  ["p9-bucket", /iremotenotary-ds3053-parent-abroad/i],
  ["p8-title", /U\.S\. Documents Signed Abroad Resource Center/i],
  ["p9-title", /DS-3053 & Parent Abroad Resource Center/i],
  ["p8-campaign", /us_documents_signed_abroad/i],
  ["p9-campaign", /ds3053_parent_abroad/i],
];
for (const [id, re] of banned) {
  if (re.test(runtimeText)) fail(id, `Forbidden pattern in runtime files: ${id}`);
}

if (/C:\\Users\\/i.test(runtimeText) || /\/Users\/frank\//i.test(runtimeText)) {
  fail("private-paths", "Private local paths must not appear in runtime files");
}

if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) {
  fail("robots-sitemap", "robots.txt sitemap must use centralized production origin");
}
if (/Disallow:\s*\/$/m.test(robots)) fail("robots-block", "robots.txt must not disallow entire site");

for (const path of [
  `${ORIGIN}/`,
  `${ORIGIN}/privacy.html`,
  `${ORIGIN}/contact.html`,
  `${ORIGIN}/sources.html`,
]) {
  if (!sitemap.includes(`<loc>${path}</loc>`)) fail("sitemap", `sitemap.xml missing ${path}`);
}
if (sitemap.includes(`${ORIGIN}/index.html`)) {
  fail("sitemap-dup-home", "sitemap must not list /index.html as a duplicate homepage on App Platform");
}

for (const needle of [
  "privacy.html",
  "contact.html",
  "sources.html",
  "Published by iRemoteNotary",
  "LATAM",
  "Gulf",
  "utm_source=digitalocean_app_platform",
  "americans_abroad_latam_gulf_resource_center",
]) {
  if (!index.includes(needle)) fail("nav-links", `index.html missing ${needle}`);
}

if (!/output_dir:\s*public/.test(appTemplate)) fail("do-output", ".do/app.yaml.template must set output_dir: public");
if (!/error_document:\s*404\.html/.test(appTemplate)) fail("do-404", ".do/app.yaml.template must set error_document: 404.html");
if (!/deploy_on_push:\s*false/.test(appTemplate)) fail("do-push", ".do/app.yaml.template must keep deploy_on_push: false");
if (/digitaloceanspaces\.com/i.test(appTemplate)) fail("do-spaces", "App template must not reference Spaces");

try {
  const parsedSources = JSON.parse(sourcesJson);
  if (!Array.isArray(parsedSources.sources) || parsedSources.sources.length < 12) {
    fail("sources-json", "data/sources.json must list public sources");
  }
  const authority = parsedSources.sources.filter((s) => s.type === "authority").length;
  const irn = parsedSources.sources.filter((s) => s.type === "iremotenotary").length;
  if (authority < 5) fail("sources-authority", "Need at least 5 authority sources");
  if (irn < 6) fail("sources-irn", "Need at least 6 iRemoteNotary sources");
} catch (error) {
  fail("sources-json-parse", error.message);
}

try {
  const hubs = JSON.parse(hubsJson);
  if (!Array.isArray(hubs.primary_hubs) || hubs.primary_hubs.length < 17) {
    fail("hubs-json", "expat-hubs.json must list at least 17 primary hubs");
  }
} catch (error) {
  fail("hubs-json-parse", error.message);
}

if (!readme.includes("DigitalOcean App Platform") || !readme.includes("ondigitalocean")) {
  fail("readme-host", "README must document DigitalOcean App Platform / ondigitalocean.app host");
}

if (errors.length) {
  console.error(`validate-site: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- [${error.id}] ${error.message}`);
  process.exit(1);
}

console.log(`validate-site: PASS${productionMode ? " (production mode)" : ` (local mode; origin=${ORIGIN})`}`);
