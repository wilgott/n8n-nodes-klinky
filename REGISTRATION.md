# Register and publish the Klinky n8n node

## Fix: "node was not published to NPM" / provenance required

n8n requires the package on npm, published via **GitHub Actions with provenance**.
Manual `npm publish` from your laptop does not count.

### Step 1 — Configure npm authentication (pick ONE)

#### Option A: OIDC Trusted Publisher (recommended)

No GitHub secrets needed.

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click your avatar → **Account Settings**
3. In the left sidebar, open **Trusted Publishers**
4. Click **Add Trusted Publisher**
5. Fill in:
   - **Provider:** GitHub Actions
   - **Repository owner:** `wilgott`
   - **Repository name:** `n8n-nodes-klinky`
   - **Workflow filename:** `publish.yml`
   - **Environment:** (leave blank)
6. Save

This allows GitHub Actions to publish without an `NPM_TOKEN` secret.

#### Option B: npm automation token

1. npmjs.com → **Access Tokens** → **Generate New Token** → **Granular Access Token**
2. Permissions: **Read and write** for package `n8n-nodes-klinky`
3. Add to GitHub:

```bash
gh secret set NPM_TOKEN --repo wilgott/n8n-nodes-klinky
```

### Step 2 — Trigger the publish workflow

After auth is configured, push a version tag:

```bash
cd integrations/n8n-nodes-klinky
git pull
npm run lint && npm run build

# Bump version in package.json if 0.1.1 already failed (use 0.1.2)
git add package.json
git commit -m "Bump version for npm publish"
git tag v0.1.2
git push origin main
git push origin v0.1.2
```

The GitHub Action will lint, build, and `npm publish --provenance --access public`.

### Step 3 — Verify

```bash
npm view n8n-nodes-klinky
npx @n8n/scan-community-package n8n-nodes-klinky
```

Check provenance on npm package page → **Provenance** tab should show the GitHub Actions run.

### Step 4 — Submit for n8n verification

https://creators.n8n.io/nodes

---

## Install (after publish)

### n8n Cloud

Settings → Community nodes → Install `n8n-nodes-klinky`

### Self-hosted

```bash
npm install n8n-nodes-klinky
```

Credentials:

- **Base URL:** `https://klinky-api.fly.dev/api/v1`
- **API Key:** `klinky_sk_...`

## What failed before

Both `v0.1.0` and `v0.1.1` GitHub Action runs failed with:

```
npm error code ENEEDAUTH
npm error need auth You need to authorize this machine using `npm adduser`
```

Cause: no `NPM_TOKEN` secret and no OIDC trusted publisher configured.
The secret named `NPM_QOSNK8E...` on the repo is not used by the workflow.
