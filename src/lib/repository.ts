import type { FileNode } from "@/types/workspace";

export type GitHubRepositoryRef = {
  owner: string;
  name: string;
};

const repositoryPart = /^[A-Za-z0-9_.-]+$/;

export const MAX_INDEXED_FILES = 120;
const MAX_INDEXED_FILE_BYTES = 60_000;
const MAX_INDEXED_BYTES = 650_000;

const supportedFiles = /(^|\/)(Dockerfile|Makefile|README(?:\.[^/]+)?|package\.json|tsconfig\.json)$|\.(?:c|cc|cpp|cs|css|go|graphql|gql|h|hpp|html|java|js|jsx|json|kt|kts|md|mdx|php|prisma|py|rb|rs|scss|sh|sql|svelte|swift|toml|ts|tsx|vue|xml|yaml|yml)$/i;
const excludedPaths = /(^|\/)(?:\.git|\.next|\.nuxt|\.output|build|coverage|dist|node_modules|target|vendor)(\/|$)|(^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml)$|(?:\.lock|\.min\.js|\.map)$/i;

export type SourceFileEntry = { path: string; size: number };

export function parseGitHubRepositoryUrl(value: string): GitHubRepositoryRef {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.username || url.password) {
    throw new Error("Use a public https://github.com repository URL.");
  }

  const [owner, rawName, ...rest] = url.pathname.split("/").filter(Boolean);
  const name = rawName?.replace(/\.git$/, "");

  if (!owner || !name || rest.length || !repositoryPart.test(owner) || !repositoryPart.test(name)) {
    throw new Error("Use a repository URL like https://github.com/owner/repository.");
  }

  return { owner, name };
}

export function createFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = [];

  for (const path of paths.sort((a, b) => a.localeCompare(b))) {
    const parts = path.split("/");
    let level = root;

    parts.forEach((part, index) => {
      const nodePath = parts.slice(0, index + 1).join("/");
      const isFile = index === parts.length - 1;
      let node = level.find((candidate) => candidate.name === part);

      if (!node) {
        node = isFile
          ? { name: part, path: nodePath, type: "file", language: languageForPath(path) }
          : { name: part, path: nodePath, type: "folder", children: [] };
        level.push(node);
      }

      if (!isFile) level = node.children ?? [];
    });
  }

  return root;
}

export function languageForPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  const languages: Record<string, string> = {
    c: "C", cpp: "C++", cs: "C#", css: "CSS", go: "Go", html: "HTML", java: "Java",
    js: "JavaScript", jsx: "JavaScript", json: "JSON", kt: "Kotlin", md: "Markdown", php: "PHP",
    py: "Python", rb: "Ruby", rs: "Rust", sh: "Shell", sql: "SQL", svelte: "Svelte", swift: "Swift",
    toml: "TOML", ts: "TypeScript", tsx: "TypeScript", vue: "Vue", yaml: "YAML", yml: "YAML",
  };
  return languages[extension ?? ""] ?? "Text";
}

export function selectCandidatePaths(question: string, files: Record<string, string>, limit = 14) {
  const ignored = new Set(["a", "about", "an", "and", "are", "can", "do", "does", "file", "files", "for", "how", "in", "is", "it", "of", "on", "the", "this", "to", "what", "where", "which", "why", "with", "work", "works"]);
  const tokens = [...new Set(question.toLowerCase().match(/[a-z0-9_]+/g)?.filter((token) => token.length > 1 && !ignored.has(token)) ?? [])];
  const stems = tokens.map((token) => token.length > 4 ? token.replace(/(?:ies|es|s|ing|ed)$/, "") : token);

  return Object.entries(files)
    .map(([path, content]) => {
      const normalized = path.toLowerCase();
      const basename = normalized.split("/").pop() ?? normalized;
      const text = content.toLowerCase();
      const pathScore = stems.reduce((score, stem) => score + (normalized.includes(stem) ? 12 : 0) + (basename.startsWith(stem) ? 6 : 0), 0);
      const contentScore = stems.reduce((score, stem) => score + Math.min(countOccurrences(text, stem), 5), 0);
      const landmarkScore = /(^|\/)(readme|package\.json|tsconfig\.json|dockerfile|makefile|index\.|main\.|page\.|route\.)/i.test(path) ? 5 : 0;
      const sourceScore = /^(src|app|lib|packages)\//.test(path) ? 2 : 0;
      return { path, score: pathScore + contentScore + landmarkScore + sourceScore };
    })
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit)
    .map(({ path }) => path);
}

function countOccurrences(text: string, term: string) {
  let count = 0;
  for (let index = text.indexOf(term); index !== -1 && count < 5; index = text.indexOf(term, index + term.length)) count += 1;
  return count;
}

export function selectSourceFiles(entries: SourceFileEntry[]) {
  const candidates = entries
    .filter(({ path, size }) => supportedFiles.test(path) && !excludedPaths.test(path) && size <= MAX_INDEXED_FILE_BYTES)
    .sort((a, b) => sourcePriority(a.path) - sourcePriority(b.path) || depth(a.path) - depth(b.path) || a.size - b.size || a.path.localeCompare(b.path));

  const selected: SourceFileEntry[] = [];
  let selectedBytes = 0;
  for (const candidate of candidates) {
    if (selected.length >= MAX_INDEXED_FILES) break;
    if (selectedBytes + candidate.size > MAX_INDEXED_BYTES) continue;
    selected.push(candidate);
    selectedBytes += candidate.size;
  }

  return { selected, candidateCount: candidates.length };
}

function sourcePriority(path: string) {
  if (/^(?:package\.json|README(?:\.[^/]+)?|Dockerfile|Makefile|tsconfig\.json)$/i.test(path)) return 0;
  if (/^(?:src|app|lib|packages)\//.test(path)) return 1;
  if (/(?:^|\/)(?:test|tests|spec|__tests__)(?:\/|$)/i.test(path)) return 3;
  return 2;
}

function depth(path: string) {
  return path.split("/").length;
}

export function resolveRepositoryPath(reference: string, paths: string[]) {
  const candidate = reference.trim().replace(/^\.?\//, "").replace(/(?::\d+){1,2}$|#L\d+(?:-L?\d+)?$/, "");
  if (!candidate || candidate.includes(" ")) return null;
  if (paths.includes(candidate)) return candidate;
  const matches = paths.filter((path) => path.endsWith(`/${candidate}`));
  return matches.length === 1 ? matches[0] : null;
}
