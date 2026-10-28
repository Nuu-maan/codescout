"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, Braces, GitFork, TriangleAlertIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRepositoryIndexer } from "@/hooks/use-repository-indexer";
import type { RepositorySnapshot } from "@/types/workspace";

const exampleRepositories = [
  { name: "sindresorhus/ky", description: "Fetch-based HTTP client" },
  { name: "pmndrs/zustand", description: "React state management" },
  { name: "expressjs/express", description: "Node.js web framework" },
  { name: "honojs/hono", description: "Web framework for any runtime" },
];

export function RepositoryWelcome({ onIndexed }: { onIndexed: (repository: RepositorySnapshot) => void }) {
  const [url, setUrl] = useState("");
  const { index, pendingUrl, loading, error } = useRepositoryIndexer(onIndexed);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void index(url);
  };

  return (
    <main className="flex min-h-0 flex-1 overflow-y-auto">
      <div className="m-auto w-full max-w-xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Braces className="size-5" /></div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-card-foreground sm:text-3xl">Understand any GitHub repository</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Paste a public repository and ask questions. SubQ Snap picks the files that matter, and every answer links back to them.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl border bg-card p-1.5 shadow-[0_8px_30px_oklch(0_0_0/0.06)] focus-within:border-foreground/20" aria-label="Add a GitHub repository">
          <GitFork className="ms-2 size-4 shrink-0 text-muted-foreground" />
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="github.com/owner/repository"
            aria-label="GitHub repository URL"
            className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0 sm:text-sm dark:bg-transparent"
            spellCheck={false}
            autoCapitalize="none"
            autoFocus
            disabled={loading}
          />
          <Button type="submit" size="icon" className="pressable shrink-0 rounded-[10px]" disabled={!url.trim() || loading} aria-label="Index repository">
            {loading && pendingUrl === url ? <Spinner /> : <ArrowUp />}
          </Button>
        </form>

        <div className="mt-3 min-h-5" aria-live="polite">
          {error ? (
            <p className="flex items-start justify-center gap-1.5 text-center text-xs text-destructive"><TriangleAlertIcon className="mt-px size-3.5 shrink-0" />{error}</p>
          ) : loading ? (
            <p className="text-center text-xs text-muted-foreground">Reading {pendingUrl?.replace(/^https?:\/\/(?:www\.)?github\.com\//, "")}. This takes a few seconds.</p>
          ) : null}
        </div>

        <div className="mt-6">
          <div className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Or try one</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {exampleRepositories.map((example) => (
              <Button
                key={example.name}
                variant="outline"
                className="pressable h-auto min-w-0 justify-start gap-3 whitespace-normal rounded-2xl p-3 text-left font-normal"
                disabled={loading}
                onClick={() => {
                  setUrl(example.name);
                  void index(example.name);
                }}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {pendingUrl === example.name ? <Spinner /> : <GitFork className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs text-card-foreground">{example.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{example.description}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
