# Americans & Expats Abroad — LATAM & Gulf Resource Center (Property #10)

Static educational microsite for FeedWalls Expansion Program v2.

## Host

- **Host:** DigitalOcean App Platform — Free Static Site
- **Host family:** `ondigitalocean.app`
- **App name:** `iremotenotary-expats-abroad`
- **Output directory:** `public/`
- **Index document:** `index.html`
- **Error document:** `404.html`
- **Region:** New York / NYC1 (`nyc`)
- **deploy_on_push:** `false` (manual redeploy only)
- **Production origin:** `https://iremotenotary-expats-abroad-dozom.ondigitalocean.app`
- **Homepage canonical:** `/` on the assigned `*.ondigitalocean.app` starter domain
- **Custom domain:** none
- **Live price:** `$0/month` static site only

Spaces (`digitaloceanspaces.com`) remains **UNUSED**. Do not add Spaces keys or AWS/GCP origins to public files.

## Validate

```bash
npm run validate
npm run validate:site:production
```

Production mode requires a real `*.ondigitalocean.app` origin in `public/site-origin.txt` and matching canonical/OG/sitemap/robots URLs. It fails if any deployable production-origin placeholder remains.

## CTA attribution

`utm_source=digitalocean_app_platform&utm_medium=referral&utm_campaign=americans_abroad_latam_gulf_resource_center`

## FeedWalls

- **Group:** `95969473`
- **Widget:** `183`
- **Render count:** 15 (5 authority + 10 iRemoteNotary)

Do not reuse Property #8 / Property #9 / FW-003 FeedWalls Group or Widget IDs.

## App Platform template

See `.do/app.yaml.template` for the free static-site shape (`output_dir: public`, `error_document: 404.html`, `deploy_on_push: false`).

## GitHub

- **Repo:** https://github.com/iremotenotary1/iremotenotary-expats-abroad-resources
- **Branch:** `main`
- **Visibility:** public

## Stop conditions (post-production)

Do **not** enable autodeploy, add a custom domain, add paid components, create Spaces, or start search discovery (GSC / Bing / IndexNow) until the next authorized phase.

## Engineering reference

Property #9 (`ds3053-parent-abroad-resources`) is the engineering/validator reference only. This property has unique intent, hubs, sources, UTM campaign, and host family.
