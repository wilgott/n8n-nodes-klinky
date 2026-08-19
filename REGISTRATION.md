# Register and publish the Klinky n8n node

The package is ready. You only need to complete the external registrations below.

## 1. Create the GitHub repository

If the repo is not pushed yet, run from `integrations/n8n-nodes-klinky`:

```bash
git init
git add .
git commit -m "Initial release of n8n-nodes-klinky"
gh repo create wilgott/n8n-nodes-klinky --public --source=. --remote=origin --push
```

Expected repo: https://github.com/wilgott/n8n-nodes-klinky

## 2. Create an npm account + access token

1. Sign in or create an account at https://www.npmjs.com/
2. Create an automation token with **Publish** access
3. Add it to the GitHub repo as secret `NPM_TOKEN`

```bash
gh secret set NPM_TOKEN --repo wilgott/n8n-nodes-klinky
```

## 3. Publish the first npm release

From the repo root:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The GitHub Action in `.github/workflows/publish.yml` will:

- build the package
- publish `n8n-nodes-klinky` to npm with provenance

After publish, verify:

```bash
npm view n8n-nodes-klinky
```

## 4. Install in n8n

### Self-hosted n8n

```bash
npm install n8n-nodes-klinky
```

Restart n8n, then add credentials:

- **Base URL**: `https://klinky-api.fly.dev/api/v1`
- **API Key**: your `klinky_sk_...` secret key

### n8n Cloud

1. Open **Settings → Community nodes**
2. Install `n8n-nodes-klinky`
3. Create **Klinky API** credentials

## 5. Submit for n8n community verification

Use the official creator portal:

https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/

Checklist before submitting:

- [ ] npm package is public
- [ ] GitHub repo URL matches `package.json` repository field
- [ ] README includes install + credential setup
- [ ] MIT license present
- [ ] Package published from GitHub Actions with provenance
- [ ] Lint passes locally:

```bash
npm install
npm run lint
npm run build
npx @n8n/scan-community-package n8n-nodes-klinky
```

## 6. Optional local testing before publish

```bash
npm install
npm run build
n8n-node dev
```

This loads the node in a local n8n instance for manual workflow testing.

## What is already done

- Klinky API public REST endpoints for link CRUD + clicks
- Credential test against `GET /public/links`
- Node operations: create, get, list, update, variants update, delete, clicks
- Form-based variant and geo-rule inputs (no raw JSON required)
- Example workflow templates in `examples/workflows/`
- npm publish workflow with provenance
- Landing page copy target: https://klinky.io/integrations/n8n

## Support contacts

- Docs: https://docs.klinky.io/
- API auth: https://docs.klinky.io/guide/api/authentication
- Klinky support: support@klinky.io
