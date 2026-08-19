# Example Workflow Ideas

Import the JSON files in `workflows/` directly into n8n.

## 1. Lead Source Link Generator

File: `workflows/lead-source-link-generator.json`

**Trigger**
- Manual trigger, Google Sheets row, Airtable record, or form webhook

**Klinky action**
- `Create Link` with **Single Destination**

**Downstream actions**
- Write `slug` / short URL back to the source row
- Notify Slack or email with the generated link

## 2. Campaign Variant Rebalance

File: `workflows/campaign-variant-rebalance.json`

**Trigger**
- Schedule, manual trigger, or campaign sync webhook

**Klinky action**
- `Update Variants`

**Use case**
- Shift traffic from 50/50 to 70/30
- Point `variant_b` to a new landing page without changing the public slug

## 3. Click Export

File: `workflows/click-export.json`

**Trigger**
- Daily schedule

**Klinky action**
- `Get Clicks`

**Downstream actions**
- Append rows to Google Sheets
- Send to a data warehouse or BI tool

## Setup notes

1. Install `n8n-nodes-klinky`
2. Create **Klinky API** credentials
3. Import a workflow JSON file
4. Replace `REPLACE_WITH_CREDENTIAL_ID` and `REPLACE_WITH_LINK_ID` placeholders
