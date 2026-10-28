import "server-only";

import {
  createFileTree,
  languageForPath,
  parseGitHubRepositoryUrl,
  selectSourceFiles,
} from "@/lib/repository";
import type { RepositorySnapshot } from "@/types/workspace";

const FETCH_BATCH_SIZE = 12;

type GitHubRepository = {
  default_branch: string;
  description: string | null;
  full_name: string;
  html_url: string;
  private: boolean;
};

type GitHubTree = {
  truncated: boolean;
  tree: Array<{ path: string; type: "blob" | "tree"; size?: number }>;
};

export async function indexPublicGitHubRepository(value: string): Promise<RepositorySnapshot> {
  const ref = parseGitHubRepositoryUrl(value);
  const repository = await githubJson<GitHubRepository>(
    `https://api.github.com/repos/${ref.owner}/${ref.name}`,
  );

  if (repository.private) throw new Error("Private repositories are not supported yet.");

  const branch = repository.default_branch;
  const commit = (
    await githubFetch(
      `https://api.github.com/repos/${ref.owner}/${ref.name}/commits/${encodeURIComponent(branch)}`,
      "application/vnd.github.sha",
    ).then((response) => response.text())
  ).trim();
  if (!/^[0-9a-f]{40}$/.test(commit))
    throw new Error("GitHub returned an unexpected commit for this repository.");
  const gitTree = await githubJson<GitHubTree>(
    `https://api.github.com/repos/${ref.owner}/${ref.name}/git/trees/${commit}?recursive=1`,
  );
  const { selected, candidateCount } = selectSourceFiles(
    gitTree.tree
      .filter((item) => item.type === "blob")
      .map(({ path, size }) => ({ path, size: size ?? 0 })),
  );

  if (!selected.length) throw new Error("No supported source files were found in this repository.");

  const files: Record<string, string> = {};
  for (let index = 0; index < selected.length; index += FETCH_BATCH_SIZE) {
    const batch = selected.slice(index, index + FETCH_BATCH_SIZE);
    const contents = await Promise.all(
      batch.map(async (file) => {
        const rawUrl = `https://raw.githubusercontent.com/${ref.owner}/${ref.name}/${commit}/${encodePath(file.path)}`;
        try {
          const response = await fetch(rawUrl, { signal: AbortSignal.timeout(15_000) });
          return response.ok ? ([file.path, await response.text()] as const) : null;
        } catch {
          return null;
        }
      }),
    );
    for (const entry of contents) if (entry) files[entry[0]] = entry[1];
  }

  const paths = Object.keys(files);
  if (!paths.length)
    throw new Error("GitHub returned the file list, but the source files could not be downloaded.");

  const indexedBytes = Object.values(files).reduce(
    (total, content) => total + Buffer.byteLength(content),
    0,
  );
  const languages = [...new Set(paths.map(languageForPath))].sort();

  return {
    id: `${repository.full_name}@${commit}`,
    owner: ref.owner,
    name: ref.name,
    fullName: repository.full_name,
    url: repository.html_url,
    branch,
    commit,
    description: repository.description,
    files,
    tree: createFileTree(paths),
    fileCount: paths.length,
    indexedBytes,
    languages,
    truncated: gitTree.truncated || paths.length < candidateCount,
  };
}

async function githubJson<T>(url: string): Promise<T> {
  return githubFetch(url).then((response) => response.json() as Promise<T>);
}

async function githubFetch(url: string, accept = "application/vnd.github+json") {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "CodeScout",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (response.status === 404)
    throw new Error("Repository not found. Make sure it is public and the URL is correct.");
  if (
    response.status === 429 ||
    (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")
  ) {
    throw new Error("GitHub rate limit reached. Try again in a few minutes.");
  }
  if (response.status === 409) throw new Error("This repository is empty.");
  if (!response.ok) throw new Error(`GitHub could not load this repository (${response.status}).`);
  return response;
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}
