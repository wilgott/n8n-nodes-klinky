# n8n — owner-only steps

Code and npm publish are done. You only need to submit for n8n verification.

## Checklist

- [x] Package published to npm: [n8n-nodes-klinky@0.1.4](https://www.npmjs.com/package/n8n-nodes-klinky)
- [x] GitHub Actions publish with provenance
- [x] Security scan passed: `npx @n8n/scan-community-package n8n-nodes-klinky`
- [ ] Submit at [creators.n8n.io/nodes](https://creators.n8n.io/nodes)

## Submit for verification

1. Go to [creators.n8n.io/nodes](https://creators.n8n.io/nodes)
2. Sign in with your n8n account (create one if needed)
3. Submit package name: **`n8n-nodes-klinky`**
4. Fill in listing details:
   - **Name:** Klinky
   - **Description:** Create and manage smart links — A/B routing, geo routing, variant rebalancing, click export
   - **Logo:** Use Klinky favicon or export from `https://klinky.io`
   - **Documentation URL:** `https://github.com/wilgott/n8n-nodes-klinky`
   - **Homepage:** `https://klinky.io/integrations/n8n`
5. Wait for n8n team review (typically a few days)
6. Respond to any feedback within 48 hours

## After approval

- Node appears in n8n community node browser
- Update landing page CTA if marketplace URL differs
- Add n8n marketplace link to [klinky.io/partners](https://klinky.io/partners)

## Optional: future releases

Push a new version tag to trigger publish:

```bash
cd integrations/n8n-nodes-klinky
# bump version in package.json
git add package.json package-lock.json
git commit -m "Release x.y.z"
git tag vx.y.z
git push origin main && git push origin vx.y.z
```

Ensure `NODE_AUTH_TOKEN` GitHub secret or npm OIDC trusted publisher is configured (see [REGISTRATION.md](./REGISTRATION.md)).
