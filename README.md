# Conversational Framework Lesson Designer

A web app that helps teachers design lessons grounded in Diana Laurillard's **Conversational Framework** (Laurillard, 2012). The teacher fills in a short form; the app calls Claude via a Netlify serverless function and returns a structured, CF-aligned lesson plan.

## Deployment

### 1. Push to GitHub

Push this repository to a GitHub account.

### 2. Connect to Netlify

1. Log in to [Netlify](https://www.netlify.com).
2. Click **Add new site → Import an existing project**.
3. Select your GitHub repository.
4. Netlify auto-detects `netlify.toml` — no extra build settings needed.

### 3. Add the API key

In the Netlify dashboard:

**Site → Configuration → Environment variables → Add a variable**

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

The key is stored server-side only and is never exposed to the browser.

### 4. Deploy

Click **Deploy site**. Netlify builds and deploys automatically.

## Project structure

```
conversational-framework-designer/
├── index.html                  # Single-page UI
├── style.css                   # All styles + print stylesheet
├── app.js                      # Frontend logic & output rendering
├── netlify/
│   └── functions/
│       └── generate.js         # Serverless function (calls Anthropic API)
├── netlify.toml                # Build config + /api/* redirect
└── README.md
```

## Local development

You can run locally with the [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
npm install                     # installs @anthropic-ai/sdk for the function
netlify dev                     # serves the site at http://localhost:8888
```

Set `ANTHROPIC_API_KEY` in a `.env` file at the project root (Netlify CLI loads it automatically):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Reference

Laurillard, D. (2012). *Teaching as a Design Science*. Routledge.
