import { createFileTree, languageForPath } from "@/lib/repository";
import type { RepositorySnapshot } from "@/types/workspace";

export const fileContents: Record<string, string> = {
  "src/lib/repo.ts": `export async function indexRepository(repo: RepositoryRef) {
  const archive = await downloadArchive(repo);
  const files = await collectSourceFiles(archive, {
    maxBytes: 25_000_000,
    exclude: DEFAULT_EXCLUDES,
  });

  return {
    commit: repo.commit,
    manifest: files.map(({ path, bytes }) => ({ path, bytes })),
    bundle: createNumberedBundle(files),
  };
}`,
  "src/lib/subq.ts": `const SUBQ_API_URL = "https://api.subq.ai/v1";

export async function decideRepositoryRoute(question: string) {
  return fetch(\`\${SUBQ_API_URL}/systemone\`, {
    method: "POST",
    headers: createSubQHeaders(),
    body: JSON.stringify({
      model: "subq-snap-preview",
      state: { question },
      questions: repositoryRoutingQuestions,
    }),
  });
}`,
  "src/lib/openrouter.ts": `const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

export async function streamRepositoryAnswer(input: AnswerInput) {
  return fetch(\`\${OPENROUTER_API_URL}/chat/completions\`, {
    method: "POST",
    headers: createOpenRouterHeaders(),
    body: JSON.stringify({
      model: "dots-studio/dots-3-note-preview:free",
      models: [model, "nvidia/nemotron-3-super-120b-a12b:free"],
      messages: createGroundedMessages(input),
      stream: true,
    }),
  });
}`,
  "src/components/workspace/workspace-shell.tsx": `export function WorkspaceShell() {
  return (
    <div className="flex h-dvh flex-col">
      <RepositoryHeader />
      <div className="flex min-h-0 flex-1">
        <NavigationRail />
        <AnalysisWorkspace onOpenSource={openSource} />
      </div>
      <RepositoryFilesSheet />
      <SourceViewerSheet />
    </div>
  );
}`,
};

export const defaultRepository: RepositorySnapshot = {
  id: "subquadratic/codescout@demo",
  owner: "subquadratic",
  name: "codescout",
  fullName: "subquadratic/codescout",
  url: "https://github.com/subquadratic/codescout",
  branch: "main",
  commit: "demo",
  description: "Repository intelligence powered by SubQ Snap and OpenRouter.",
  files: fileContents,
  tree: createFileTree(Object.keys(fileContents)),
  fileCount: Object.keys(fileContents).length,
  indexedBytes: Object.values(fileContents).reduce((total, content) => total + content.length, 0),
  languages: [...new Set(Object.keys(fileContents).map(languageForPath))],
  truncated: false,
};
