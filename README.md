# N Natural — Careers

Careers landing page for N Natural Hair Studio. Static HTML/CSS/JS, ready for **Vercel**.

## Stack

- `index.html` — full page (nav → footer), job detail modals, apply form
- `assets/` — images and icons from Figma
- Form submits JSON to an n8n webhook (see `WEBHOOK_URL` in `index.html`)

## Local preview

```bash
# Python
python3 -m http.server 8080

# or Node
npx serve .
```

Open http://localhost:8080

## Deploy on Vercel

1. Push this repo to GitHub
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo
3. Framework Preset: **Other**
4. Root Directory: `.`
5. Deploy

No build step required. Static files are served as-is.

After deploy, allow your Vercel domain in the n8n webhook CORS settings so browser form submits succeed.

## Apply flow

1. Open Roles list → **apply for this role** opens job detail modal  
2. Detail → **apply for this role** opens application form  
3. Submit → `POST` JSON to n8n (resume as base64 when attached)

Job detail copy matches Figma Expanded Job View ([425:71](https://www.figma.com/design/1Ks8qI7IdHBlVIa2SenPsW/N-Natural-Hair-Salon?node-id=425-71)).

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

Change `WEBHOOK_URL` near the top of the `<script>` in `index.html` when moving off the n8n test webhook.
