import assert from "node:assert/strict";
import test from "node:test";
import {
  createFileTree,
  parseGitHubRepositoryUrl,
  resolveRepositoryPath,
  selectCandidatePaths,
  selectSourceFiles,
} from "./repository.ts";

test("parses only canonical public GitHub repository URLs", () => {
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/anishfn/snapshift"), {
    owner: "anishfn",
    name: "snapshift",
  });
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/openai/openai-node.git"), {
    owner: "openai",
    name: "openai-node",
  });
  assert.deepEqual(parseGitHubRepositoryUrl("github.com/vercel/ms/"), {
    owner: "vercel",
    name: "ms",
  });
  assert.deepEqual(parseGitHubRepositoryUrl(" vercel/ms "), { owner: "vercel", name: "ms" });
  assert.deepEqual(parseGitHubRepositoryUrl("https://www.github.com/vercel/ms"), {
    owner: "vercel",
    name: "ms",
  });
  assert.throws(() => parseGitHubRepositoryUrl("http://github.com/openai/openai-node"));
  assert.throws(() => parseGitHubRepositoryUrl("https://gist.github.com/openai/openai-node"));
  assert.throws(() => parseGitHubRepositoryUrl("https://example.com/openai/openai-node"));
  assert.throws(() => parseGitHubRepositoryUrl("https://github.com/openai/openai-node/issues"));
});

test("builds a nested file tree from repository paths", () => {
  const tree = createFileTree(["src/app/page.tsx", "src/lib/query.ts", "README.md"]);
  assert.equal(tree[0].name, "README.md");
  assert.equal(tree[1].name, "src");
  assert.equal(tree[1].children?.[0].path, "src/app");
});

test("shortlists paths that match the repository question", () => {
  const files = Object.fromEntries(
    ["README.md", "src/app/page.tsx", "src/app/api/github/files/route.ts", "src/lib/theme.ts"].map(
      (path) => [path, ""],
    ),
  );
  const selected = selectCandidatePaths("Where are GitHub files loaded?", files, 2);
  assert.equal(selected[0], "src/app/api/github/files/route.ts");
  assert.equal(selected.length, 2);
});

test("shortlists files whose contents mention the question terms", () => {
  const selected = selectCandidatePaths(
    "How do retries work?",
    {
      "src/core/client.ts": "const retryCount = 0;\nfunction retry() { return shouldRetry(); }",
      "src/utils/format.ts": "export const format = (value) => value;",
      "src/utils/merge.ts": "export const merge = (a, b) => ({ ...a, ...b });",
    },
    1,
  );
  assert.deepEqual(selected, ["src/core/client.ts"]);
});

test("indexes root landmarks first and keeps filling after a file that does not fit", () => {
  const sourceFiles = "abcdefghijkl"
    .split("")
    .map((name) => ({ path: `src/${name}.ts`, size: 55_000 }));
  const { selected, candidateCount } = selectSourceFiles([
    { path: "docs/guide.md", size: 400 },
    ...sourceFiles,
    { path: "src/huge.ts", size: 70_000 },
    { path: "package-lock.json", size: 900 },
    { path: "README.md", size: 2_000 },
    { path: "package.json", size: 800 },
    { path: "logo.png", size: 50 },
  ]);
  const paths = selected.map(({ path }) => path);
  assert.deepEqual(paths.slice(0, 2), ["package.json", "README.md"]);
  assert.equal(paths.includes("src/k.ts"), true);
  assert.equal(paths.includes("src/l.ts"), false);
  assert.equal(paths.at(-1), "docs/guide.md");
  assert.equal(candidateCount, 15);
});

test("resolves file references written in answers", () => {
  const paths = ["source/core/Ky.ts", "source/index.ts", "test/index.ts", "README.md"];
  assert.equal(resolveRepositoryPath("source/core/Ky.ts", paths), "source/core/Ky.ts");
  assert.equal(resolveRepositoryPath("./source/core/Ky.ts:42", paths), "source/core/Ky.ts");
  assert.equal(resolveRepositoryPath("core/Ky.ts#L10-L20", paths), "source/core/Ky.ts");
  assert.equal(resolveRepositoryPath("Ky.ts", paths), "source/core/Ky.ts");
  assert.equal(resolveRepositoryPath("index.ts", paths), null);
  assert.equal(resolveRepositoryPath("retry()", paths), null);
});
