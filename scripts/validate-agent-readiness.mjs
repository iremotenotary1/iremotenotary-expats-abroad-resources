import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const index = readFileSync(join(PUBLIC, "index.html"), "utf8");
const privacy = readFileSync(join(PUBLIC, "privacy.html"), "utf8");
const contact = readFileSync(join(PUBLIC, "contact.html"), "utf8");
const sources = readFileSync(join(PUBLIC, "sources.html"), "utf8");
const errors = [];

function fail(id, message) {
  errors.push({ id, message });
}

if (!/<main\b[^>]*id=["']main["']/i.test(index)) fail("main", 'Missing <main id="main">');
if (!/<header\b/i.test(index) || !/<nav\b/i.test(index) || !/<footer\b/i.test(index)) {
  fail("landmarks", "Missing header/nav/footer landmarks");
}

const anchors = [
  "start-here",
  "where-do-you-live",
  "primary-hubs",
  "before-you-book",
  "decision-matrix",
  "identity-abroad",
  "embassy-vs-ron",
  "wet-ink",
  "witnesses-abroad",
  "apostille",
  "latam-hubs",
  "gulf-hubs",
  "secondary-hubs",
  "common-scenarios",
  "power-of-attorney-brief",
  "affidavits-brief",
  "real-estate-brief",
  "family-ds3053",
  "timezone-planning",
  "checklist",
  "common-errors",
  "authority-resources",
  "geo-answers",
  "faq",
  "publisher-standards",
  "service-cta",
];
for (const id of anchors) {
  if (!new RegExp(`id=["']${id}["']`).test(index)) fail(`anchor-${id}`, `Missing stable section #${id}`);
}

const hubAnchors = [
  "mexico-city",
  "lake-chapala-ajijic",
  "puerto-vallarta",
  "panama-city",
  "boquete-chiriqui",
  "costa-rica-central-valley",
  "santo-domingo",
  "punta-cana-bavaro",
  "quito",
  "cuenca",
  "guayaquil",
  "dubai",
  "abu-dhabi",
  "doha",
  "riyadh",
  "jeddah",
  "saudi-eastern-province",
];
for (const id of hubAnchors) {
  if (!new RegExp(`id=["']${id}["']`).test(index)) fail(`hub-${id}`, `Missing primary hub #${id}`);
}

const tasks = [
  ["publisher", /Published by iRemoteNotary/],
  ["decision", /id=["']decision-matrix["']/],
  ["service-cta", /Request an International Online Notary Session/],
  ["edu-cta", /Explore LATAM & Gulf Hubs|Start with where you live/i],
  ["privacy-path", /privacy\.html/],
  ["utm", /utm_source=digitalocean_app_platform/],
];
for (const [id, re] of tasks) {
  if (!re.test(index)) fail(`task-${id}`, `Agent task path missing: ${id}`);
}

if (!privacy.includes("Privacy notice") || !contact.includes("Contact iRemoteNotary") || !sources.includes("Sources and methodology")) {
  fail("secondary-pages", "Privacy/contact/sources pages missing expected headings");
}

if (!/Editorial Policy|Notary Service Standards/i.test(index)) {
  fail("standards", "Missing editorial/service standards links");
}

const ambiguous = index.match(/>(Click here|Learn more|Continue)</gi) || [];
if (ambiguous.length) fail("ambiguous-cta", `Ambiguous CTA labels found: ${ambiguous.join(", ")}`);

if (errors.length) {
  console.error(`validate-agent-readiness: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- [${error.id}] ${error.message}`);
  process.exit(1);
}

console.log("validate-agent-readiness: PASS");
