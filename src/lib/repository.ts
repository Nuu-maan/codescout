import type { FileNode } from "@/types/workspace";

export type GitHubRepositoryRef = {
  owner: string;
  name: string;
};

const repositoryPart = /^[A-Za-z0-9_.-]+$/;

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

export function selectCandidatePaths(question: string, paths: string[], limit = 14) {
  const ignored = new Set(["a", "about", "and", "are", "does", "file", "files", "for", "how", "in", "is", "it", "of", "the", "this", "to", "what", "where", "which"]);
  const tokens = question.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 1 && !ignored.has(token)) ?? [];

  return paths
    .map((path) => {
      const normalized = path.toLowerCase();
      const basename = normalized.split("/").pop() ?? normalized;
      const tokenScore = tokens.reduce((score, token) => score + (normalized.includes(token) ? 12 : 0) + (basename.startsWith(token) ? 6 : 0), 0);
      const landmarkScore = /(^|\/)(readme|package\.json|tsconfig\.json|dockerfile|makefile|index\.|main\.|page\.|route\.)/i.test(path) ? 5 : 0;
      const sourceScore = /^(src|app|lib|packages)\//.test(path) ? 2 : 0;
      return { path, score: tokenScore + landmarkScore + sourceScore };
    })
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit)
    .map(({ path }) => path);
}
