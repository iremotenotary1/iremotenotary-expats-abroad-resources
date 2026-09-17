# Americans & Expats Abroad — LATAM & Gulf Resource Center (Property #10)

Static educational microsite for FeedWalls Expansion Program v2.

## Host

- **Host:** DigitalOcean App Platform — Free Static Site
- **Host family:** `ondigitalocean.app`
- **Output directory:** `public/`
- **Index document:** `index.html`
- **Error document:** `404.html`
- **Region (template):** `nyc`
- **deploy_on_push:** `false` (initial)
- **Placeholder origin (local):** `https://PROPERTY-010-NOT-DEPLOYED.ondigitalocean.invalid`
- **Post-deploy homepage canonical:** `/` on the actual `*.ondigitalocean.app` starter domain

Spaces (`digitaloceanspaces.com`) remains **UNUSED**. Do not add Spaces keys or AWS/GCP origins to public files.

## Validate

```bash
npm run validate
npm run validate:site:production
```

Production mode must **FAIL** while the `.invalid` placeholder origin remains.

## CTA attribution

`utm_source=digitalocean_app_platform&utm_medium=referral&utm_campaign=americans_abroad_latam_gulf_resource_center`

## FeedWalls

**PENDING** — iframe stub with `data-fw-pending` and `FEEDWALLS_PENDING`.  
Do not reuse Property #8 / Property #9 / FW-003 FeedWalls Group or Widget IDs.

## App Platform template

See `.do/app.yaml.template` (OWNER placeholder; do not deploy until free-tier pricing is confirmed $0/month).

## Stop conditions

Do **not** create: DigitalOcean App, GitHub remote, Spaces bucket, custom domain, paid components, search submissions, or Property #11 in this phase.

## Engineering reference

Property #9 (`ds3053-parent-abroad-resources`) is the engineering/validator reference only. This property has unique intent, hubs, sources, UTM campaign, and host family.
