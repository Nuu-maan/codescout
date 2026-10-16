import "server-only";

import { createFileTree, languageForPath, parseGitHubRepositoryUrl } from "@/lib/repository";
import type { RepositorySnapshot } from "@/types/workspace";

const MAX_FILES = 120;
const MAX_FILE_BYTES = 60_000;
const MAX_TOTAL_BYTES = 650_000;
const FETCH_BATCH_SIZE = 12;

const supportedFiles = /(^|\/)(Dockerfile|Makefile|README(?:\.[^/]+)?|package\.json|tsconfig\.json)$|\.(?:c|cc|cpp|cs|css|go|graphql|gql|h|hpp|html|java|js|jsx|json|kt|kts|md|mdx|php|prisma|py|rb|rs|scss|sh|sql|svelte|swift|toml|ts|tsx|vue|xml|yaml|yml)$/i;
const excludedPaths = /(^|\/)(?:\.git|\.next|\.nuxt|\.output|build|coverage|dist|node_modules|target|vendor)(\/|$)|(?:\.lock|\.min\.js|\.map)$/i;

type GitHubRepository = {
  default_branch: string;
  description: string | null;
  full_name: string;
  html_url: string;
  private: boolean;
};

type GitHubTree = {
  sha: string;
  truncated: boolean;
  tree: Array<{ path: string; type: "blob" | "tree"; size?: number }>;
};

export async function indexPublicGitHubRepository(value: string): Promise<RepositorySnapshot> {
  const ref = parseGitHubRepositoryUrl(value);
  const repository = await githubJson<GitHubRepository>(`https://api.github.com/repos/${ref.owner}/${ref.name}`);

  if (repository.private) throw new Error("Private repositories are not supported yet.");

  const branch = repository.default_branch;
  const gitTree = await githubJson<GitHubTree>(
    `https://api.github.com/repos/${ref.owner}/${ref.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  const candidates = gitTree.tree
    .filter((item) => item.type === "blob" && supportedFiles.test(item.path) && !excludedPaths.test(item.path))
    .filter((item) => (item.size ?? 0) <= MAX_FILE_BYTES)
    .sort(compareSourcePriority);

  const selected: typeof candidates = [];
  let selectedBytes = 0;
  for (const candidate of candidates) {
    const size = candidate.size ?? 0;
    if (selected.length >= MAX_FILES || selectedBytes + size > MAX_TOTAL_BYTES) break;
    selected.push(candidate);
    selectedBytes += size;
  }

  if (!selected.length) throw new Error("No supported source files were found in this repository.");

  const files: Record<string, string> = {};
  for (let index = 0; index < selected.length; index += FETCH_BATCH_SIZE) {
    const batch = selected.slice(index, index + FETCH_BATCH_SIZE);
    const contents = await Promise.all(batch.map(async (file) => {
      const rawUrl = `https://raw.githubusercontent.com/${ref.owner}/${ref.name}/${encodeURIComponent(branch)}/${encodePath(file.path)}`;
      const response = await fetch(rawUrl, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) return null;
      return [file.path, await response.text()] as const;
    }));
    for (const entry of contents) if (entry) files[entry[0]] = entry[1];
  }

  const paths = Object.keys(files);
  if (!paths.length) throw new Error("GitHub returned the file list, but the source files could not be downloaded.");

  const indexedBytes = Object.values(files).reduce((total, content) => total + Buffer.byteLength(content), 0);
  const languages = [...new Set(paths.map(languageForPath))].sort();

  return {
    id: `${repository.full_name}@${gitTree.sha.slice(0, 12)}`,
    owner: ref.owner,
    name: ref.name,
    fullName: repository.full_name,
    url: repository.html_url,
    branch,
    commit: gitTree.sha.slice(0, 12),
    description: repository.description,
    files,
    tree: createFileTree(paths),
    fileCount: paths.length,
    indexedBytes,
    languages,
    truncated: gitTree.truncated || paths.length < candidates.length,
  };
}

async function githubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "CodeScout",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (response.status === 404) throw new Error("Repository not found. Make sure it is public and the URL is correct.");
  if (response.status === 403) throw new Error("GitHub rate limit reached. Try again in a few minutes.");
  if (!response.ok) throw new Error(`GitHub could not load this repository (${response.status}).`);
  return response.json() as Promise<T>;
}

function compareSourcePriority(a: { path: string; size?: number }, b: { path: string; size?: number }) {
  return sourcePriority(a.path) - sourcePriority(b.path) || (a.size ?? 0) - (b.size ?? 0) || a.path.localeCompare(b.path);
}

function sourcePriority(path: string) {
  if (/^(?:src|app|lib|packages)\//.test(path)) return 0;
  if (/(?:^|\/)(?:package\.json|README(?:\.|$)|Dockerfile|Makefile|tsconfig\.json)$/i.test(path)) return 1;
  if (/(?:^|\/)(?:test|tests|spec|__tests__)(?:\/|$)/i.test(path)) return 3;
  return 2;
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}
