import { selectCandidatePaths } from "@/lib/repository";

const SUBQ_API_URL = "https://api.subq.ai/v1";

export type RepositoryDecision = {
  route: "answer" | "navigate" | "unsupported";
  confidence: number;
  needsSources: boolean;
  consideredFiles: string[];
  selectedFiles: string[];
  fileScores: Record<string, number>;
};

export function getSubQKey() {
  return process.env["SUBQ-KEY"] ?? process.env.SUBQ_API_KEY;
}

export function createSubQHeaders() {
  const apiKey = getSubQKey();

  if (!apiKey) {
    throw new Error("SubQ API key is not configured");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function decideRepositoryRoute(
  question: string,
  repositoryFiles: Record<string, string>,
  repositoryName = "repository",
  signal?: AbortSignal,
): Promise<RepositoryDecision> {
  const candidatePaths = selectCandidatePaths(question, repositoryFiles);
  const files = candidatePaths.map((path, index) => ({
    id: `file_${index}`,
    path,
    content: repositoryFiles[path],
  }));
  const fileQuestions = Object.fromEntries(
    files.map((file) => [
      `use_${file.id}`,
      {
        type: "noul",
        instructions: `Should ${file.path} be given to the writer to answer this question?`,
        criteria: {
          true: "The file directly supports, explains, or locates the answer.",
          false: "The writer can answer without this file.",
        },
      },
    ]),
  );
  const timeout = AbortSignal.timeout(30_000);
  const response = await fetch(`${SUBQ_API_URL}/systemone`, {
    method: "POST",
    headers: createSubQHeaders(),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    body: JSON.stringify({
      model: "subq-snap-preview",
      state: { question, repository: repositoryName, files },
      questions: {
        route: {
          type: "choice",
          instructions: "Choose how CodeScout should handle this repository question.",
          criteria: {
            answer: "Explain code, architecture, behavior, or implementation details.",
            navigate: "Locate a file, symbol, definition, or source location.",
            unsupported: "The request is unrelated to understanding or navigating the repository.",
          },
        },
        needs_sources: {
          type: "noul",
          instructions: "Should the response cite specific repository files?",
          criteria: {
            true: "The answer depends on code or configuration in the repository.",
            false: "The question can be answered without repository evidence.",
          },
        },
        ...fileQuestions,
      },
    }),
  }).catch((error: unknown) => {
    if (timeout.aborted) throw new Error("SubQ Snap took too long to choose source files. Try again.");
    throw error;
  });

  if (!response.ok) {
    throw new Error(await getSubQError(response));
  }

  const payload = (await response.json()) as {
    answers?: Record<string, { choice?: string; confidence?: number; noul?: number }>;
  };
  const route = payload.answers?.route?.choice;
  const fileScores = Object.fromEntries(
    files.map((file) => [file.path, payload.answers?.[`use_${file.id}`]?.noul ?? 0]),
  );

  return {
    route: route === "navigate" || route === "unsupported" ? route : "answer",
    confidence: payload.answers?.route?.confidence ?? 0,
    needsSources: (payload.answers?.needs_sources?.noul ?? 1) >= 0.5,
    consideredFiles: candidatePaths,
    selectedFiles: files
      .filter((file) => fileScores[file.path] >= 0.5)
      .sort((a, b) => fileScores[b.path] - fileScores[a.path])
      .map((file) => file.path),
    fileScores,
  };
}

async function getSubQError(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    detail?: { message?: string };
  } | null;

  return payload?.detail?.message ?? `SubQ decision failed with status ${response.status}.`;
}

export { SUBQ_API_URL };
