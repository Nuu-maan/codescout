import { streamRepositoryAnswer } from "@/lib/openrouter";
import { isResponseModelId } from "@/lib/models";
import { isValidOpenRouterKey } from "@/lib/openrouter-key";
import { decideRepositoryRoute } from "@/lib/subq";

const MAX_FILES = 120;
const MAX_CONTEXT_CHARACTERS = 700_000;

type QueryPayload = {
  model?: unknown;
  question?: string;
  repository?: {
    fullName?: string;
    files?: Record<string, unknown>;
  };
};

export const maxDuration = 60;

export async function POST(request: Request) {
  const payload = (await request.json()) as QueryPayload;
  const question = payload.question?.trim();
  const suppliedOpenRouterKey = request.headers.get("x-openrouter-key")?.trim();

  if (!question) {
    return Response.json({ error: "Enter a question about the repository." }, { status: 400 });
  }

  if (!isResponseModelId(payload.model)) {
    return Response.json({ error: "Choose a supported response model." }, { status: 400 });
  }

  if (suppliedOpenRouterKey && !isValidOpenRouterKey(suppliedOpenRouterKey)) {
    return Response.json({ error: "The personal OpenRouter key is invalid." }, { status: 400 });
  }

  const repositoryFiles = validateRepositoryFiles(payload.repository?.files);
  if (repositoryFiles instanceof Response) return repositoryFiles;

  try {
    const decision = await decideRepositoryRoute(
      question,
      repositoryFiles,
      payload.repository?.fullName ?? "repository",
    );
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
      decision,
      model: payload.model,
      repositoryContext,
      signal: request.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.text();
      return Response.json(
        { error: detail || "OpenRouter could not answer this question." },
        { status: response.status || 502 },
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

function validateRepositoryFiles(input?: Record<string, unknown>) {
  if (!input || Array.isArray(input)) {
    return Response.json({ error: "Add a repository before running an analysis." }, { status: 400 });
  }

  const entries = Object.entries(input);
  if (!entries.length || entries.length > MAX_FILES) {
    return Response.json({ error: `Repository snapshots must contain between 1 and ${MAX_FILES} files.` }, { status: 413 });
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

function withMetadata(
  upstream: ReadableStream<Uint8Array>,
  metadata: { route: string; confidence: number; selectedPaths: string[] },
) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "codescout.metadata", ...metadata })}\n\n`));
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
