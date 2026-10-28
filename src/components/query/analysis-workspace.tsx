"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import {
  Braces,
  Check,
  ChevronDown,
  Circle,
  Copy,
  FileCode2,
  Files,
  GitBranch,
  Network,
  RefreshCw,
  ShieldCheck,
  TriangleAlertIcon,
  Workflow,
} from "@/components/ui/icons";
import { Streamdown } from "streamdown";
import { QueryBar } from "@/components/query/query-bar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ListRow } from "@/components/ui/list-row";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import { Spinner } from "@/components/ui/spinner";
import { defaultResponseModel, getResponseModel, type ResponseModelId } from "@/lib/models";
import { resolveRepositoryPath } from "@/lib/repository";
import type { ConversationTurn, RepositorySnapshot } from "@/types/workspace";

type AnalysisWorkspaceProps = {
  openRouterKey: string;
  repository: RepositorySnapshot;
  onOpenSource: (path: string) => void;
  onOpenFiles: () => void;
};

type QueryRun = {
  id: string;
  question: string;
  answer: string;
  model: ResponseModelId;
  status: "streaming" | "complete" | "stopped" | "error";
  thinking?: boolean;
  error?: string;
  route?: string;
  confidence?: number;
  selectedPaths?: string[];
};

type RunMetadata = Pick<QueryRun, "route" | "confidence" | "selectedPaths">;

const suggestions = [
  { icon: Braces, label: "Explain the architecture", description: "the major modules and how they fit together", prompt: "Explain the architecture and major modules in this repository." },
  { icon: Workflow, label: "Trace the main execution path", description: "from the entry point to the output", prompt: "Trace the main execution path from entry point to output." },
  { icon: Network, label: "Map important dependencies", description: "what it relies on and where", prompt: "Map the important dependencies and how they are used." },
  { icon: ShieldCheck, label: "Find security-sensitive code", description: "the risky paths and why they matter", prompt: "Find the security-sensitive code paths and explain their risks." },
];

const HISTORY_TURNS = 4;

export function AnalysisWorkspace({ repository, openRouterKey, onOpenSource, onOpenFiles }: AnalysisWorkspaceProps) {
  const [runs, setRuns] = useState<QueryRun[]>([]);
  const [model, setModel] = useState<ResponseModelId>(defaultResponseModel);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  const paths = useMemo(() => Object.keys(repository.files), [repository.files]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (viewport && stickToBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
  }, [runs]);

  const updateRun = (id: string, update: Partial<QueryRun> | ((run: QueryRun) => Partial<QueryRun>)) => {
    setRuns((current) => current.map((run) => run.id === id ? { ...run, ...(typeof update === "function" ? update(run) : update) } : run));
  };

  const runQuery = async (question: string, previousRuns = runs) => {
    const id = crypto.randomUUID();
    const controller = new AbortController();
    const history: ConversationTurn[] = previousRuns
      .filter((run) => run.answer && (run.status === "complete" || run.status === "stopped"))
      .slice(-HISTORY_TURNS)
      .map(({ question, answer }) => ({ question, answer }));
    let answer = "";

    controllerRef.current = controller;
    stickToBottomRef.current = true;
    setRuns([...previousRuns, { id, question, answer: "", model, status: "streaming" }]);
    setSubmitting(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(openRouterKey ? { "X-OpenRouter-Key": openRouterKey } : {}),
        },
        body: JSON.stringify({ question, model, history, repository: { fullName: repository.fullName, files: repository.files } }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error(await readErrorMessage(response));

      await readAnswerStream(response.body, {
        onDelta: (delta) => {
          answer += delta;
          updateRun(id, (run) => ({ answer: run.answer + delta, thinking: false }));
        },
        onReasoning: () => updateRun(id, (run) => run.thinking || run.answer ? {} : { thinking: true }),
        onMetadata: (metadata) => updateRun(id, metadata),
      });

      updateRun(id, answer.trim()
        ? { status: "complete", thinking: false }
        : { status: "error", thinking: false, error: "The model returned an empty answer. Try again or pick another model." });
    } catch (error) {
      if (controller.signal.aborted) {
        updateRun(id, { status: "stopped", thinking: false });
      } else {
        const message = error instanceof Error ? error.message : "Unable to analyze the repository.";
        updateRun(id, { status: "error", thinking: false, error: message });
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setSubmitting(false);
    }
  };

  const retry = (failedRun: QueryRun) => {
    void runQuery(failedRun.question, runs.filter((run) => run.id !== failedRun.id));
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-background" aria-label="Repository conversation">
      <header className="flex h-12 shrink-0 items-center gap-2 px-4 sm:px-5">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-card-foreground">{repository.fullName}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><GitBranch className="size-3" />{repository.branch}<span>·</span><span>{repository.fileCount} files indexed{repository.truncated && " (partial)"}</span></div>
        </div>
        <Button variant="ghost" size="sm" className="ms-auto gap-1.5 text-xs lg:hidden" onClick={onOpenFiles}><Files /> Files</Button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
        onScroll={(event) => {
          const viewport = event.currentTarget;
          stickToBottomRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 96;
        }}
      >
        {runs.length ? (
          <div className="mx-auto w-full max-w-[676px] space-y-14 px-4 py-8 sm:px-6 sm:py-10">
            {runs.map((run) => (
              <ConversationTurnView key={run.id} run={run} paths={paths} onOpenSource={onOpenSource} onRetry={submitting ? undefined : () => retry(run)} />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex min-h-full w-full max-w-[676px] animate-enter flex-col justify-center px-4 py-10 sm:px-6">
            <div className="mb-10">
              <div className="mb-5 flex size-11 items-center justify-center rounded-[13px] bg-primary text-primary-foreground"><Braces className="size-5" /></div>
              <h1 className="text-[22px] font-medium tracking-[-0.02em] text-card-foreground">What do you want to understand?</h1>
              <p className="mt-2 max-w-lg text-[15px] leading-6">Ask about <span className="text-card-foreground">{repository.name}</span>. SubQ Snap picks the files that matter, and every answer links back to them.</p>
            </div>
            <div className="mb-2 text-[13px]">start with <span className="text-muted-foreground/60">/</span> 04</div>
            <div className="space-y-1">
              {suggestions.map(({ icon: Icon, label, description, prompt }) => (
                <ListRow key={label} icon={<Icon className="size-[18px]" />} title={label} description={description} disabled={submitting} onClick={() => void runQuery(prompt)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 bg-background px-4 pb-4 pt-2 sm:px-0">
        <div className="mx-auto max-w-[676px] sm:px-6">
          <QueryBar
            repositoryName={repository.name}
            submitting={submitting}
            onSubmit={(question) => runQuery(question)}
            onStop={() => controllerRef.current?.abort()}
            model={model}
            onModelChange={setModel}
            hasPersonalKey={Boolean(openRouterKey)}
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">CodeScout can make mistakes. Check important details in the cited files.</p>
        </div>
      </footer>
    </main>
  );
}

function ConversationTurnView({ run, paths, onOpenSource, onRetry }: { run: QueryRun; paths: string[]; onOpenSource: (path: string) => void; onRetry?: () => void }) {
  const streaming = run.status === "streaming";
  const selectedPaths = run.selectedPaths ?? [];
  const confidence = Math.round((run.confidence ?? 0) * 100);
  const components = useMemo(() => ({
    inlineCode: ({ children }: ComponentProps<"code">) => {
      const path = typeof children === "string" ? resolveRepositoryPath(children, paths) : null;
      const className = "rounded-[6px] bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-card-foreground";
      if (!path) return <code className={className}>{children}</code>;
      return (
        <button type="button" className="inline rounded-[6px] align-baseline [&>code]:transition-colors [&>code]:duration-150 [&>code]:hover:bg-accent" onClick={() => onOpenSource(path)} title={`Open ${path}`}>
          <code className={`${className} underline decoration-muted-foreground/40 decoration-dotted underline-offset-4`}>{children}</code>
        </button>
      );
    },
  }), [paths, onOpenSource]);

  return (
    <div className="space-y-6">
      <Message align="end" className="animate-enter">
        <MessageContent>
          <Bubble align="end" variant="muted"><BubbleContent className="max-w-[30rem] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[15px] text-card-foreground">{run.question}</BubbleContent></Bubble>
        </MessageContent>
      </Message>

      <Message>
        <MessageContent className="min-w-0 gap-3">
          <DecisionSummary run={run} selectedPaths={selectedPaths} confidence={confidence} />
          {run.answer ? (
            <Streamdown className="answer max-w-none animate-enter text-[15px] leading-7" isAnimating={streaming} components={components}>{run.answer}</Streamdown>
          ) : streaming ? (
            <div key={getPendingLabel(run)} className="inline-flex animate-enter items-center gap-2 py-2 text-sm text-muted-foreground"><Spinner /> {getPendingLabel(run)}</div>
          ) : run.status === "stopped" ? (
            <p className="animate-enter py-2 text-sm text-muted-foreground">Stopped before the answer started.</p>
          ) : null}

          {run.status === "error" && (
            <div role="alert" className="flex animate-enter flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] bg-destructive/8 py-2 ps-3.5 pe-2 text-sm text-destructive dark:bg-destructive/15">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">{run.error}</span>
              {onRetry && <Button variant="ghost" size="sm" className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onRetry}><RefreshCw /> Try again</Button>}
            </div>
          )}

          {selectedPaths.length > 0 && (
            <div className="mt-2 animate-enter">
              <div className="mb-2 text-[13px] text-muted-foreground">sources <span className="text-muted-foreground/60">/</span> {String(selectedPaths.length).padStart(2, "0")}</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPaths.map((path) => (
                  <Button key={path} variant="outline" size="sm" className="h-7 max-w-full gap-1.5 rounded-[10px] px-2.5 text-[11px] font-normal" onClick={() => onOpenSource(path)}>
                    <FileCode2 className="size-3 text-muted-foreground" /><span className="truncate font-mono">{path}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {run.answer && !streaming && (
            <MessageFooter className="animate-enter gap-1 px-0">
              <CopyButton value={run.answer} />
              {run.status === "complete" && <span className="ms-1 inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground"><ShieldCheck className="size-3 text-success" /> Grounded in {selectedPaths.length} {selectedPaths.length === 1 ? "file" : "files"}</span>}
              {run.status === "stopped" && <span className="ms-1 text-[11px] text-muted-foreground">Stopped</span>}
            </MessageFooter>
          )}
        </MessageContent>
      </Message>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1_500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "Copied" : "Copy answer"}
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => setCopied(true), () => {});
      }}
    >
      {copied ? <Check key="copied" className="animate-icon-in text-success" /> : <Copy key="copy" className="animate-icon-in" />}
    </Button>
  );
}

function DecisionSummary({ run, selectedPaths, confidence }: { run: QueryRun; selectedPaths: string[]; confidence: number }) {
  const model = getResponseModel(run.model);
  if (!run.route && run.status !== "streaming") return null;

  return (
    <Collapsible className="animate-enter">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-fit gap-1.5 px-2 text-[11px] font-normal text-muted-foreground">
          {run.route ? <Check key="routed" className="size-3.5 animate-icon-in text-success" /> : <Circle key="routing" className="size-3.5 animate-pulse fill-muted-foreground/20 text-muted-foreground" />}
          {run.route ? `SubQ Snap picked ${selectedPaths.length} ${selectedPaths.length === 1 ? "file" : "files"}` : "SubQ Snap is choosing files"}
          <ChevronDown className="size-3" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 w-fit rounded-[10px] bg-secondary px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-4 gap-y-1"><span>Route: <strong className="font-medium text-card-foreground">{run.route ?? "waiting"}</strong></span><span>Confidence: <strong className="font-medium tabular-nums text-card-foreground">{confidence}%</strong></span><span>Writer: <strong className="font-medium text-card-foreground">{model.name}</strong></span></div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function getPendingLabel(run: QueryRun) {
  if (!run.route) return "Finding the right source files…";
  if (run.thinking) return "Thinking…";
  return "Writing the answer…";
}

async function readErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  if (typeof payload?.error === "string") return payload.error;
  if (response.status === 504) return "The answer took too long. Try a narrower question.";
  return `The analysis could not be completed (${response.status}).`;
}

async function readAnswerStream(
  stream: ReadableStream<Uint8Array>,
  handlers: { onDelta: (delta: string) => void; onReasoning: () => void; onMetadata: (metadata: RunMetadata) => void },
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      let event: {
        type?: string;
        route?: string;
        confidence?: number;
        selectedPaths?: string[];
        error?: { message?: string };
        choices?: Array<{ delta?: { content?: string; reasoning?: string | null } }>;
      };
      try {
        event = JSON.parse(line.slice(6));
      } catch {
        continue;
      }

      if (event.type === "codescout.metadata") {
        handlers.onMetadata({ route: event.route, confidence: event.confidence, selectedPaths: event.selectedPaths });
        continue;
      }
      if (event.error) throw new Error(event.error.message || "The model stopped with an error. Try again or pick another model.");

      const delta = event.choices?.[0]?.delta;
      if (delta?.content) handlers.onDelta(delta.content);
      else if (delta?.reasoning) handlers.onReasoning();
    }

    if (done) break;
  }
}
