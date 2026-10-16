"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
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
  Workflow,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { QueryBar } from "@/components/query/query-bar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import { Spinner } from "@/components/ui/spinner";
import type { RepositorySnapshot } from "@/types/workspace";

type AnalysisWorkspaceProps = {
  repository: RepositorySnapshot;
  onOpenSource: (path: string) => void;
  onOpenFiles: () => void;
  onChangeRepository: () => void;
};

type QueryRun = {
  id: string;
  question: string;
  answer: string;
  status: "streaming" | "complete";
  route?: string;
  confidence?: number;
  selectedPaths?: string[];
};

const suggestions = [
  { icon: Braces, label: "Explain the architecture", prompt: "Explain the architecture and major modules in this repository." },
  { icon: Workflow, label: "Trace the main execution path", prompt: "Trace the main execution path from entry point to output." },
  { icon: Network, label: "Map important dependencies", prompt: "Map the important dependencies and how they are used." },
  { icon: ShieldCheck, label: "Find security-sensitive code", prompt: "Find the security-sensitive code paths and explain their risks." },
];

export function AnalysisWorkspace({ repository, onOpenSource, onOpenFiles, onChangeRepository }: AnalysisWorkspaceProps) {
  const [runs, setRuns] = useState<QueryRun[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [runs]);

  const updateRun = (id: string, update: Partial<QueryRun> | ((run: QueryRun) => Partial<QueryRun>)) => {
    setRuns((current) => current.map((run) => run.id === id ? { ...run, ...(typeof update === "function" ? update(run) : update) } : run));
  };

  const runQuery = async (question: string) => {
    const id = crypto.randomUUID();
    setRuns((current) => [...current, { id, question, answer: "", status: "streaming" }]);
    setSubmitting(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, repository: { fullName: repository.fullName, files: repository.files } }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "The repository analysis could not be completed.");
      }

      await readAnswerStream(
        response.body,
        (delta) => updateRun(id, (run) => ({ answer: run.answer + delta })),
        (metadata) => updateRun(id, metadata),
      );
      updateRun(id, { status: "complete" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to analyze the repository.";
      setRuns((current) => current.filter((run) => run.id !== id));
      toast.error("Analysis failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-background" aria-label="Repository conversation">
      <header className="flex h-12 shrink-0 items-center border-b px-4 sm:px-5">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-card-foreground">{repository.fullName}</div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><GitBranch className="size-3" />{repository.branch}<span>·</span><span>{repository.fileCount} files indexed</span></div>
        </div>
        <div className="ms-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs lg:hidden" onClick={onOpenFiles}><Files /> Files</Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onChangeRepository}><RefreshCw /> Switch</Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {runs.length ? (
          <div className="mx-auto w-full max-w-3xl space-y-12 px-4 py-8 sm:px-6 sm:py-10">
            {runs.map((run) => <ConversationTurn key={run.id} run={run} onOpenSource={onOpenSource} />)}
            <div ref={endRef} className="h-1" />
          </div>
        ) : (
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Braces className="size-5" /></div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-card-foreground sm:text-3xl">What do you want to understand?</h1>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Ask about {repository.name}. Answers are routed by SubQ Snap and grounded in the indexed source.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map(({ icon: Icon, label, prompt }) => (
                <Button key={label} variant="outline" className="h-auto min-w-0 justify-start gap-3 whitespace-normal rounded-2xl p-3.5 text-left font-normal" disabled={submitting} onClick={() => void runQuery(prompt)}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1 text-sm">{label}</span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 bg-background px-4 pb-4 pt-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <QueryBar repositoryName={repository.name} submitting={submitting} onSubmit={runQuery} />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">CodeScout can make mistakes. Verify important details in the cited source files.</p>
        </div>
      </footer>
    </main>
  );
}

function ConversationTurn({ run, onOpenSource }: { run: QueryRun; onOpenSource: (path: string) => void }) {
  const streaming = run.status === "streaming";
  const selectedPaths = run.selectedPaths ?? [];
  const confidence = Math.round((run.confidence ?? 0) * 100);

  return (
    <div className="space-y-7">
      <Message align="end">
        <MessageContent>
          <Bubble align="end" variant="muted"><BubbleContent className="max-w-[36rem] px-4 py-2.5">{run.question}</BubbleContent></Bubble>
        </MessageContent>
      </Message>

      <Message>
        <MessageContent className="gap-3">
          <DecisionSummary run={run} selectedPaths={selectedPaths} confidence={confidence} />
          {run.answer ? (
            <Streamdown className="max-w-none text-[15px] leading-7" isAnimating={streaming}>{run.answer}</Streamdown>
          ) : (
            <div className="inline-flex items-center gap-2 py-2 text-sm text-muted-foreground"><Spinner /> {run.route ? "Writing the answer…" : "Finding the right source files…"}</div>
          )}

          {selectedPaths.length > 0 && (
            <div className="mt-2">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Sources</div>
              <div className="flex flex-wrap gap-2">
                {selectedPaths.map((path) => (
                  <Button key={path} variant="outline" size="sm" className="h-7 max-w-full gap-1.5 rounded-lg px-2 text-[10px] font-normal" onClick={() => onOpenSource(path)}>
                    <FileCode2 className="size-3" /><span className="truncate font-mono">{path}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <MessageFooter className="gap-1 px-0">
            <Button variant="ghost" size="icon-xs" aria-label="Copy response" onClick={() => void navigator.clipboard.writeText(run.answer)}><Copy /></Button>
            {!streaming && <span className="ms-1 inline-flex items-center gap-1 text-[10px] font-normal text-muted-foreground"><ShieldCheck className="size-3 text-emerald-600" /> Grounded in {selectedPaths.length} files</span>}
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}

function DecisionSummary({ run, selectedPaths, confidence }: { run: QueryRun; selectedPaths: string[]; confidence: number }) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-fit gap-1.5 px-2 text-[11px] font-normal text-muted-foreground">
          {run.route ? <Check className="size-3.5 text-emerald-600" /> : <Circle className="size-3.5 animate-pulse fill-primary/20 text-primary" />}
          {run.route ? `Analyzed ${selectedPaths.length} source files` : "Selecting repository evidence"}
          <ChevronDown className="size-3" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 w-fit rounded-lg bg-secondary px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-4 gap-y-1"><span>Route: <strong className="font-medium text-foreground">{run.route ?? "waiting"}</strong></span><span>Confidence: <strong className="font-medium text-foreground">{confidence}%</strong></span><span>Writer: <strong className="font-medium text-foreground">OpenRouter</strong></span></div>
      </CollapsibleContent>
    </Collapsible>
  );
}

async function readAnswerStream(stream: ReadableStream<Uint8Array>, onDelta: (delta: string) => void, onMetadata: (metadata: Pick<QueryRun, "route" | "confidence" | "selectedPaths">) => void) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as { type?: string; delta?: string; route?: string; confidence?: number; selectedPaths?: string[]; choices?: Array<{ delta?: { content?: string } }> };
        if (event.type === "codescout.metadata") {
          onMetadata({ route: event.route, confidence: event.confidence, selectedPaths: event.selectedPaths });
          continue;
        }
        const delta = event.type === "response.output_text.delta" ? event.delta : event.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        continue;
      }
    }

    if (done) break;
  }
}
