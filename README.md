# N Natural — Careers

Careers landing page for N Natural Hair Studio. Static HTML/CSS/JS, ready for **Vercel**.

## Stack

- `template.html` — full page (nav → footer), job detail modals, apply form; served through `api/page.js`
- `assets/` — images and icons from Figma
- `api/page.js` — Vercel serverless function; merges job postings from the Google Sheet into `template.html`, cached ~5 min, falling back to the roles already in the file
- `scripts/` — sheet reading, parsing and injection, plus `dev-server.js` for local preview
- `api/apply.js` — Vercel serverless proxy; reads `WEBHOOK_URL` from env and forwards applications to n8n
- `n8n/careers-application-workflow.json` — importable n8n workflow (webhook → Sheets → emails)
- Form submits JSON to `/api/apply` (webhook URL stays server-side)

## Local preview

Static page only:

```bash
python3 -m http.server 8080
# or: npx serve .
```

Form submit needs the API route — use Vercel CLI:

```bash
cp .env.example .env.local
# set WEBHOOK_URL=... in .env.local
npx vercel dev
```

## Deploy on Vercel

1. Push this repo to GitHub
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo
3. Framework Preset: **Other**
4. Root Directory: `.`
5. **Settings → Environment Variables** → add:

| Name | Value | Environments |
|------|--------|--------------|
| `WEBHOOK_URL` | Your n8n **production** webhook URL (e.g. `https://n8n.sparkprosalon.com/webhook/careers-application`) | Production, Preview |

6. Deploy (redeploy after adding/changing the env var)

The browser never sees the n8n URL — `/api/apply` forwards POSTs using `WEBHOOK_URL`.

## Apply flow

1. Open Roles list → **apply for this role** opens job detail modal  
2. Detail → **apply for this role** opens application form  
3. Submit → `POST` JSON to `/api/apply` → n8n (resume as base64 when attached)

Job detail copy matches Figma Expanded Job View ([425:71](https://www.figma.com/design/1Ks8qI7IdHBlVIa2SenPsW/N-Natural-Hair-Salon?node-id=425-71)).

## n8n workflow (import)

Import [`n8n/careers-application-workflow.json`](n8n/careers-application-workflow.json) in n8n: **Workflows → Import from File**.

Flow: **Webhook** → **Prepare Application** → **Append to Google Sheet** → **Internal Hiring Alert** (HTML) → **Applicant Acknowledgement** (HTML) → **Respond to Webhook**.

### Google Sheet headers

Import [`n8n/Applications-template.xlsx`](n8n/Applications-template.xlsx) into Google Sheets (**File → Import**), or create a tab named `Applications` with this header row (exact names):

```
submittedAt	role	fullName	email	phone	cityState	localToMaryland	availableToStart	availability	compensationOk	yearsExperience	tools	supportedAreas	fitWhy	prioritizeTasks	organizedExample	linkedin	openToCall	referencesAvailable	resumeFileName	resumeMimeType
```

Paste the spreadsheet ID into the **Append to Google Sheet** node (`REPLACE_WITH_SPREADSHEET_ID`). Resume **base64 is not stored** in Sheets (too large); filename/mime are saved, and the file is attached on the internal email when present.

### Credentials after import

1. Connect **Google Sheets OAuth2** on **Append to Google Sheet**
2. Connect **Gmail OAuth2** on **Internal Hiring Alert** and **Applicant Acknowledgement**
3. Confirm internal To (default: `justemail@nnaturalhairstudio.com`)
4. Activate the workflow
5. Copy the **production** webhook URL into the Vercel env var `WEBHOOK_URL` (not into `index.html`)
6. Redeploy on Vercel so the function picks up the env var

## Webhook payload

```json
{
  "role": "Executive Assistant",
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "cityState": "...",
  "localToMaryland": "...",
  "availableToStart": "...",
  "availability": ["Weekday mornings"],
  "compensationOk": "...",
  "yearsExperience": "...",
  "tools": "...",
  "supportedAreas": ["..."],
  "fitWhy": "...",
  "prioritizeTasks": "...",
  "organizedExample": "...",
  "linkedin": "...",
  "openToCall": "...",
  "referencesAvailable": "...",
  "resume": { "fileName": "resume.pdf", "mimeType": "application/pdf", "base64": "..." },
  "submittedAt": "ISO-8601"
}
```
