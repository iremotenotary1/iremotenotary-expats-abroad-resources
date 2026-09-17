import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const errors = [];

const FORBIDDEN = [
  { id: "group-95969471", re: /95969471/ },
  { id: "group-95969472", re: /95969472/ },
  { id: "group-95969447", re: /95969447/ },
  { id: "widget-180", re: /Widget\s*180|\bwidgetID=180\b/i },
  { id: "widget-181", re: /Widget\s*181|\bwidgetID=181\b/i },
  { id: "widget-150", re: /Widget\s*150|\bwidgetID=150\b/i },
  { id: "amazonaws", re: /amazonaws\.com/i },
  { id: "spaces", re: /digitaloceanspaces\.com/i },
  { id: "gcs", re: /storage\.googleapis\.com/i },
  { id: "p8-bucket", re: /iremotenotary-us-documents-signed-abroad/i },
  { id: "p9-bucket", re: /iremotenotary-ds3053-parent-abroad/i },
  { id: "p8-title", re: /U\.S\. Documents Signed Abroad Resource Center/ },
  { id: "p9-title", re: /DS-3053 & Parent Abroad Resource Center/ },
  { id: "p8-campaign", re: /us_documents_signed_abroad/ },
  { id: "p9-campaign", re: /ds3053_parent_abroad/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const isMeta =
    /validate-contamination|validate-site|validate-feedwalls|validate-links|README\.md|PROPERTY-010|NOTES\.md|app\.yaml\.template/.test(
      file,
    );
  for (const rule of FORBIDDEN) {
    if (!rule.re.test(text)) continue;
    if (isMeta && /(Must not|do not reuse|FORBIDDEN|contamination|Property #8|Property #9|ban|NOT reuse)/i.test(text)) {
      continue;
    }
    errors.push(`${rule.id} found in ${file}`);
  }
}

if (errors.length) {
  console.error(`validate-contamination: FAIL (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("validate-contamination: PASS (ZERO unintended P8/P9 / Spaces / AWS / GCS markers)");
