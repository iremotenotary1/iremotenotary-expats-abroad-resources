import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const errors = [];
const fail = (id, msg) => errors.push(`[${id}] ${msg}`);

const REQUIRED_PRIMARY = [
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

let hubs;
let index;
try {
  hubs = JSON.parse(readFileSync(join(PUBLIC, "data", "expat-hubs.json"), "utf8"));
  index = readFileSync(join(PUBLIC, "index.html"), "utf8");
} catch (error) {
  console.error(`validate-expat-data: FAIL — ${error.message}`);
  process.exit(1);
}

if (hubs.property !== "FW-010") fail("property", "expat-hubs.json property must be FW-010");
if (hubs.last_verified !== "2026-09-16") fail("verified", "last_verified must be 2026-09-16");
if (!Array.isArray(hubs.claim_limits) || hubs.claim_limits.length < 4) {
  fail("limits", "claim_limits must document population/InterNations rules");
}

const primary = hubs.primary_hubs || [];
const ids = primary.map((h) => h.id);
if (primary.length !== 17) fail("count", `Expected 17 primary hubs, found ${primary.length}`);
for (const id of REQUIRED_PRIMARY) {
  if (!ids.includes(id)) fail("missing-hub", `Missing primary hub ${id}`);
  if (!new RegExp(`id=["']${id}["']`).test(index)) fail("html-hub", `index.html missing #${id}`);
}

const latam = primary.filter((h) => h.region === "latam");
const gulf = primary.filter((h) => h.region === "gulf");
if (latam.length !== 11) fail("latam-count", `Expected 11 LATAM primary hubs, found ${latam.length}`);
if (gulf.length !== 6) fail("gulf-count", `Expected 6 Gulf primary hubs, found ${gulf.length}`);

const panama = primary.find((h) => h.id === "panama-city");
if (!panama?.population_claim || panama.population_claim.scope !== "countrywide") {
  fail("panama-claim", "Panama City must carry countrywide date-qualified ICS claim");
}
if (!/2022/.test(panama?.population_claim?.as_of || "")) fail("panama-year", "Panama claim must be date-qualified to 2022");

const cr = primary.find((h) => h.id === "costa-rica-central-valley");
if (!/120,000|120000/.test(cr?.population_claim?.figure || "")) fail("cr-figure", "Costa Rica claim missing ~120,000");
if (cr?.population_claim?.scope !== "countrywide") fail("cr-scope", "Costa Rica figure must be countrywide");

const dr = primary.find((h) => h.id === "santo-domingo");
if (!/300,000|300000/.test(dr?.population_claim?.figure || "")) fail("dr-figure", "DR claim missing ~300,000");
if (dr?.population_claim?.scope !== "countrywide") fail("dr-scope", "DR figure must be countrywide");

const doha = primary.find((h) => h.id === "doha");
if (!/15,000|15000/.test(doha?.population_claim?.figure || "")) fail("doha-figure", "Qatar claim missing ~15,000");

const excluded = hubs.excluded_from_primary || [];
for (const name of ["Nigeria", "India", "Pakistan", "Uzbekistan"]) {
  if (!excluded.includes(name)) fail("excluded", `Must exclude ${name} from primary map`);
}

const watch = hubs.watchlist || [];
if (!watch.some((w) => /lebanon|beirut/i.test(w.id || w.name || ""))) {
  fail("watchlist", "Lebanon/Beirut must remain watchlist_only");
}

if (/InterNations/i.test(index) && !/survey/i.test(index)) {
  fail("internations", "InterNations mentions must be labeled survey");
}

if ((hubs.secondary_hubs || []).length < 8) fail("secondary", "Need secondary hub directory entries");

if (errors.length) {
  console.error(`validate-expat-data: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`validate-expat-data: PASS (17 primary = ${latam.length} LATAM + ${gulf.length} Gulf)`);
