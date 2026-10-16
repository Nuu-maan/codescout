import assert from "node:assert/strict";
import test from "node:test";
import { createFileTree, parseGitHubRepositoryUrl, selectCandidatePaths } from "./repository.ts";

test("parses only canonical public GitHub repository URLs", () => {
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/anishfn/snapshift"), { owner: "anishfn", name: "snapshift" });
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/openai/openai-node.git"), { owner: "openai", name: "openai-node" });
  assert.throws(() => parseGitHubRepositoryUrl("http://github.com/openai/openai-node"));
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
  const paths = ["README.md", "src/app/page.tsx", "src/app/api/github/files/route.ts", "src/lib/theme.ts"];
  const selected = selectCandidatePaths("Where are GitHub files loaded?", paths, 2);
  assert.equal(selected[0], "src/app/api/github/files/route.ts");
  assert.equal(selected.length, 2);
});
