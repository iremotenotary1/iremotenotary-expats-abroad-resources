import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const index = readFileSync(join(ROOT, "public", "index.html"), "utf8");
const errors = [];

function requireText(id, re, message) {
  if (!re.test(index)) errors.push({ id, message });
}

requireText("quick-answer", /id=["']quick-answer["']/, "Missing #quick-answer");
requireText("start-here", /id=["']start-here["']/, "Missing #start-here");
requireText("where-live", /id=["']where-do-you-live["']/, "Missing #where-do-you-live");
requireText("decision-matrix", /id=["']decision-matrix["']/, "Missing #decision-matrix");
requireText("identity", /id=["']identity-abroad["']/, "Missing #identity-abroad");
requireText("embassy-vs-ron", /id=["']embassy-vs-ron["']/, "Missing #embassy-vs-ron");
requireText("wet-ink", /id=["']wet-ink["']/, "Missing #wet-ink");
requireText("witnesses", /id=["']witnesses-abroad["']/, "Missing #witnesses-abroad");
requireText("apostille", /id=["']apostille["']/, "Missing #apostille");
requireText("latam", /id=["']latam-hubs["']/, "Missing #latam-hubs");
requireText("gulf", /id=["']gulf-hubs["']/, "Missing #gulf-hubs");
requireText("secondary", /id=["']secondary-hubs["']/, "Missing #secondary-hubs");
requireText("publisher", /Published by iRemoteNotary/, "Missing publisher signal");
requireText("geo-library", /id=["']geo-answers["']/, "Missing GEO answer library");
requireText("biometrics", /biometrics-first|biometric/i, "Missing biometrics-first identity framing");
requireText("national-not-city", /national.*(not|≠|!=).*city|not a city|countrywide|not .*city-only/i, "Missing national≠city population guardrail");
requireText("internations", /InterNations.*survey|survey only/i, "Missing InterNations survey-only framing");
requireText("no-remote-embassy", /do not offer remote|no remote.*consular|personal appearance/i, "Missing consular personal-appearance language");

const geoIds = [...index.matchAll(/\bid=["'](geo-\d+)["']/gi)].map((m) => m[1]);
const unique = new Set(geoIds);
if (unique.size < 24) {
  errors.push({ id: "geo-count", message: `Need at least 24 unique GEO blocks (found ${unique.size})` });
}
if (unique.size > 28) {
  errors.push({ id: "geo-count-high", message: `Expected 24–28 GEO blocks (found ${unique.size})` });
}
for (let i = 1; i <= Math.min(unique.size, 24); i += 1) {
  requireText(`geo-${i}`, new RegExp(`id=["']geo-${i}["']`), `Missing GEO answer block #${i}`);
}

if (errors.length) {
  console.error(`validate-geo: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- [${error.id}] ${error.message}`);
  process.exit(1);
}

console.log(`validate-geo: PASS (${unique.size} GEO answer blocks)`);
