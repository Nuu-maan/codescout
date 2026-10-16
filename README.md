# CodeScout

CodeScout lets you add a public GitHub repository and ask questions to quickly understand and navigate its codebase with source-backed answers.

SubQ Snap selects the most relevant source files and OpenRouter streams the final response. The interface includes repository browsing, formatted answers, routing details, and clickable source citations.

## Local development

Requirements:

- Node.js 22 or later
- pnpm 11
- A SubQ API key
- An OpenRouter API key

Copy the environment template and add your credentials:

```bash
cp .env.example .env.local
```

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SUBQ-KEY` | Routes questions and selects repository evidence with SubQ Snap |
| `OPENROUTER` | Generates streamed, repository-grounded answers |

Secrets must stay in local environment files or deployment environment settings. Do not commit their values.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
