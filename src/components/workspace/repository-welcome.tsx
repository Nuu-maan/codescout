"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, Braces, GitFork, TriangleAlertIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { Spinner } from "@/components/ui/spinner";
import { useRepositoryIndexer } from "@/hooks/use-repository-indexer";
import type { RepositorySnapshot } from "@/types/workspace";

const exampleRepositories = [
  { name: "sindresorhus/ky", description: "a tiny http client built on fetch." },
  { name: "pmndrs/zustand", description: "small, fast state management for react." },
  { name: "expressjs/express", description: "the minimal web framework for node." },
  { name: "honojs/hono", description: "a web framework for any javascript runtime." },
];

export function RepositoryWelcome({
  onIndexed,
}: {
  onIndexed: (repository: RepositorySnapshot) => void;
}) {
  const [url, setUrl] = useState("");
  const { index, pendingUrl, loading, error } = useRepositoryIndexer(onIndexed);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void index(url);
  };

  return (
    <main className="flex min-h-0 flex-1 overflow-y-auto">
      <div className="m-auto w-full max-w-[676px] animate-enter px-4 py-12 sm:px-6">
        <div className="mb-8">
          <div className="mb-5 flex size-11 items-center justify-center rounded-[13px] bg-primary text-primary-foreground">
            <Braces className="size-5" />
          </div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em] text-card-foreground">
            Understand any GitHub repository
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-6">
            Paste a public repository and ask questions.{" "}
            <span className="text-card-foreground">SubQ Snap</span> picks the files that matter, and
            every answer links back to them.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-2xl bg-card p-1.5 shadow-raised transition-shadow duration-200 ease-out-quint focus-within:shadow-popover"
          aria-label="Add a GitHub repository"
        >
          <GitFork className="ms-2.5 size-4 shrink-0 text-muted-foreground" />
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="github.com/owner/repository"
            aria-label="GitHub repository URL"
            className="h-9 min-w-0 flex-1 bg-transparent px-1 text-base shadow-none focus-visible:ring-0 sm:text-sm"
            spellCheck={false}
            autoCapitalize="none"
            autoFocus
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 rounded-[10px]"
            disabled={!url.trim() || loading}
            aria-label="Index repository"
          >
            {loading && pendingUrl === url ? <Spinner /> : <ArrowUp />}
          </Button>
        </form>

        <div className="mt-3 min-h-5 text-[13px]" aria-live="polite">
          {error ? (
            <p key={error} className="flex animate-enter items-start gap-1.5 text-destructive">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : loading ? (
            <p className="animate-enter text-muted-foreground">
              Reading {pendingUrl?.replace(/^https?:\/\/(?:www\.)?github\.com\//, "")}. This takes a
              few seconds.
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          <div className="mb-2 text-[13px]">
            examples <span className="text-muted-foreground/60">/</span>{" "}
            {String(exampleRepositories.length).padStart(2, "0")}
          </div>
          <div className="space-y-1">
            {exampleRepositories.map((example) => (
              <ListRow
                key={example.name}
                icon={
                  pendingUrl === example.name ? <Spinner /> : <GitFork className="size-[18px]" />
                }
                title={example.name}
                description={example.description}
                disabled={loading}
                onClick={() => {
                  setUrl(example.name);
                  void index(example.name);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
