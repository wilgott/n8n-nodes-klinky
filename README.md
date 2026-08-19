# n8n-nodes-klinky

Official community node for [Klinky](https://klinky.io) in [n8n](https://n8n.io).

Create smart links, update destinations, rebalance A/B traffic, and export click events directly from your automation workflows.

## Why use Klinky in n8n

Klinky is built for teams that want links to be part of the workflow stack, not a manual copy/paste step:

- Short links with one destination
- A/B split links with weighted variants
- Geo-routed links by country
- Click event export for downstream reporting

Analytics dashboards and winner promotion stay in Klinky. This node focuses on link lifecycle automation.

## Install

### n8n Cloud

1. Open **Settings → Community nodes**
2. Enter `n8n-nodes-klinky`
3. Install the package

### Self-hosted n8n

```bash
cd ~/.n8n/custom
npm install n8n-nodes-klinky
```

Restart n8n after installation.

## Credentials

Create a **Klinky API** credential in n8n:

| Field | Value |
| --- | --- |
| Base URL | `https://klinky-api.fly.dev/api/v1` |
| API Key | `klinky_sk_...` secret key |

Create API keys in the Klinky dashboard under **Settings → API Keys**.

Write operations require a secret key. Read-only operations can use publishable keys, but secret keys are recommended for setup simplicity.

Docs: [docs.klinky.io/guide/api/authentication](https://docs.klinky.io/guide/api/authentication)

## Operations

| Operation | Description |
| --- | --- |
| Create Link | Create a single-destination, A/B, or geo-routed link |
| Get Link | Fetch one link by ID |
| Get Many Links | List links with pagination |
| Update Link | Update metadata, active state, geo rules, conversion settings |
| Update Variants | Replace destinations and weights |
| Delete Link | Soft-delete a link |
| Get Clicks | Export click events with optional date filters |

## Example workflows

Import the templates from `examples/workflows/`:

- **Lead Source Link Generator** — create a short link after a form or sheet row
- **Campaign Variant Rebalance** — shift traffic weights without changing the public URL
- **Click Export** — pull click events into reporting tools

See `examples/README.md` for setup notes.

## Development

```bash
npm install
npm run build
npm run lint
```

Local n8n dev loop:

```bash
n8n-node dev
```

## Publish / verification

See [REGISTRATION.md](./REGISTRATION.md) for npm publish and n8n community verification steps.

## Links

- Product: [klinky.io](https://klinky.io)
- Integration page: [klinky.io/integrations/n8n](https://klinky.io/integrations/n8n)
- Docs: [docs.klinky.io](https://docs.klinky.io/)
- API reference: [docs.klinky.io/guide/api/links](https://docs.klinky.io/guide/api/links)
- GitHub: [github.com/wilgott/n8n-nodes-klinky](https://github.com/wilgott/n8n-nodes-klinky)

## License

MIT
