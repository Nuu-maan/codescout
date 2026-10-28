import { streamRepositoryAnswer } from "@/lib/openrouter";
import { isResponseModelId } from "@/lib/models";
import { isValidOpenRouterKey } from "@/lib/openrouter-key";
import { decideRepositoryRoute } from "@/lib/subq";
import { rateLimit, readJsonBody } from "@/lib/http";
import { MAX_INDEXED_FILES } from "@/lib/repository";
import type { ConversationTurn } from "@/types/workspace";

const MAX_CONTEXT_CHARACTERS = 700_000;
const MAX_QUESTION_CHARACTERS = 4_000;
const MAX_HISTORY_TURNS = 4;
const MAX_HISTORY_ANSWER_CHARACTERS = 6_000;

type QueryPayload = {
  history?: unknown;
  model?: unknown;
  question?: unknown;
  repository?: {
    fullName?: unknown;
    files?: unknown;
  };
};

export const maxDuration = 300;

export async function POST(request: Request) {
  const limited = rateLimit(request, "query", 12);
  if (limited) return limited;

  const payload = await readJsonBody<QueryPayload>(request);
  if (!payload) {
    return Response.json({ error: "The request body must be a JSON object." }, { status: 400 });
  }

  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  const suppliedOpenRouterKey = request.headers.get("x-openrouter-key")?.trim();

  if (!question) {
    return Response.json({ error: "Enter a question about the repository." }, { status: 400 });
  }

  if (question.length > MAX_QUESTION_CHARACTERS) {
    return Response.json({ error: `Keep questions under ${MAX_QUESTION_CHARACTERS.toLocaleString("en-US")} characters.` }, { status: 413 });
  }

  if (!isResponseModelId(payload.model)) {
    return Response.json({ error: "Choose a supported response model." }, { status: 400 });
  }

  if (suppliedOpenRouterKey && !isValidOpenRouterKey(suppliedOpenRouterKey)) {
    return Response.json({ error: "The personal OpenRouter key is invalid." }, { status: 400 });
  }

  const repositoryFiles = validateRepositoryFiles(payload.repository?.files);
  if (repositoryFiles instanceof Response) return repositoryFiles;

  const history = getHistory(payload.history);

  try {
    const decision = await decideRepositoryRoute(question, repositoryFiles, {
      repositoryName: getRepositoryName(payload.repository?.fullName),
      previousQuestions: history.map((turn) => turn.question),
      signal: request.signal,
    });
    const selectedFiles = decision.selectedFiles.length
      ? decision.selectedFiles
      : decision.consideredFiles;
    const repositoryContext = selectedFiles
      .map((path) => [path, repositoryFiles[path]] as const)
      .map(([path, content]) => `--- ${path} ---\n${content}`)
      .join("\n\n");
    const response = await streamRepositoryAnswer({
      apiKey: suppliedOpenRouterKey,
      question,
      history,
      decision,
      model: payload.model,
      repositoryContext,
      signal: request.signal,
    });

    if (!response.ok || !response.body) {
      return Response.json(
        { error: await getOpenRouterError(response, Boolean(suppliedOpenRouterKey)) },
        { status: response.status === 401 || response.status === 402 || response.status === 429 ? response.status : 502 },
      );
    }

    return new Response(withMetadata(response.body, {
      route: decision.route,
      confidence: decision.confidence,
      selectedPaths: selectedFiles,
    }), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run the answer pipeline.";
    return Response.json({ error: message }, { status: 503 });
  }
}

function getHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((turn): turn is ConversationTurn => typeof turn?.question === "string" && typeof turn?.answer === "string" && Boolean(turn.answer))
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      question: turn.question.slice(0, MAX_QUESTION_CHARACTERS),
      answer: turn.answer.slice(0, MAX_HISTORY_ANSWER_CHARACTERS),
    }));
}

function getRepositoryName(value: unknown) {
  return typeof value === "string" && value.length <= 200 ? value : "repository";
}

function validateRepositoryFiles(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "Add a repository before running an analysis." }, { status: 400 });
  }

  const entries = Object.entries(input);
  if (!entries.length || entries.length > MAX_INDEXED_FILES) {
    return Response.json({ error: `Repository snapshots must contain between 1 and ${MAX_INDEXED_FILES} files.` }, { status: 413 });
  }

  let totalCharacters = 0;
  const files: Record<string, string> = {};
  for (const [path, content] of entries) {
    if (typeof content !== "string" || !path || path.length > 300 || path.includes("\0")) {
      return Response.json({ error: "The repository snapshot contains an invalid file." }, { status: 400 });
    }
    totalCharacters += content.length;
    if (totalCharacters > MAX_CONTEXT_CHARACTERS) {
      return Response.json({ error: "The repository snapshot is too large to analyze in one request." }, { status: 413 });
    }
    files[path] = content;
  }

  return files;
}

async function getOpenRouterError(response: Response, personalKey: boolean) {
  if (response.status === 401) {
    return personalKey ? "OpenRouter rejected your key. Check it in the key settings." : "OpenRouter rejected the server key.";
  }
  if (response.status === 429) return "This model is busy right now. Try again shortly or pick another model.";
  const payload = (await response.json().catch(() => null)) as { error?: { message?: unknown } } | null;
  return typeof payload?.error?.message === "string" ? payload.error.message : "OpenRouter could not answer this question.";
}

function withMetadata(
  upstream: ReadableStream<Uint8Array>,
  metadata: { route: string; confidence: number; selectedPaths: string[] },
) {
  const event = new TextEncoder().encode(`data: ${JSON.stringify({ type: "codescout.metadata", ...metadata })}\n\n`);
  return upstream.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      controller.enqueue(event);
    },
  }));
}
