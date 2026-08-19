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

## 2. Configure npm publishing

Choose one:

### Option A — OIDC trusted publisher (recommended)

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Create the package (or open package settings after first publish)
3. Under **Publish access → Trusted Publishers**, add **GitHub Actions**:
   - Repository owner: `wilgott`
   - Repository name: `n8n-nodes-klinky`
   - Workflow name: `publish.yml`
4. No `NPM_TOKEN` secret needed

### Option B — npm automation token

```bash
gh secret set NPM_TOKEN --repo wilgott/n8n-nodes-klinky
```

## 3. Publish the first npm release

Use the n8n release command (do not run `npm publish` directly):

```bash
cd integrations/n8n-nodes-klinky
npm install
npm run release
```

This lints, builds, bumps the version, tags, pushes, and triggers the GitHub Action with provenance.

If you already pushed tag `v0.1.0` and the workflow failed, fix secrets then either:

```bash
git tag -d v0.1.0 && git push origin :refs/tags/v0.1.0
npm run release
```

Or bump to `0.1.1` and push a new tag.

Verify:

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
