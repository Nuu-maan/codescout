# CodeScout

CodeScout lets you add a public GitHub repository and ask questions to quickly understand and navigate its codebase with source-backed answers.

SubQ Snap selects the most relevant source files and OpenRouter streams the final response. The interface includes repository browsing, formatted answers, routing details, follow-up questions, and clickable source citations.

## How it works

1. **Indexing** (`POST /api/repositories`) resolves the default branch to a commit and downloads up to 120 source files (650 KB) from that exact commit. Root files such as the README and `package.json` come first, then source folders, then everything else.
2. **Shortlisting** scores every indexed file against the question and the previous question, by path and by contents, and keeps the top 14.
3. **Routing** sends the shortlist to SubQ Snap (`subq-snap-preview`), which classifies the question and decides which files the writer needs.
4. **Answering** streams the selected files and the recent conversation to the chosen OpenRouter model. File paths in the answer open in the source viewer.

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

| Variable                             | Required                               | Purpose                                                                                                                  |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `SUBQ-KEY` or `SUBQ_API_KEY`         | Yes                                    | Routes questions and selects repository evidence with SubQ Snap                                                          |
| `OPENROUTER` or `OPENROUTER_API_KEY` | Yes, unless every visitor brings a key | Generates streamed, repository-grounded answers                                                                          |
| `GITHUB_TOKEN`                       | Recommended in production              | Raises the GitHub API limit from 60 to 5,000 requests per hour. A fine-grained token with no extra permissions is enough |

Visitors can also add a personal OpenRouter key from the key button in the header. It stays in their browser and is sent only with their questions.

Secrets must stay in local environment files or deployment environment settings. Do not commit their values.

## Limits

- Public repositories only, up to 120 files and 650 KB per snapshot
- Questions are capped at 4,000 characters, and the last four turns are sent as context
- Each client can index 6 repositories and ask 12 questions per minute

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
