"use client";

import { FormEvent, useState } from "react";
import { GitFork, Plus, TriangleAlertIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRepositoryIndexer } from "@/hooks/use-repository-indexer";
import type { RepositorySnapshot } from "@/types/workspace";

type RepositoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexed: (repository: RepositorySnapshot) => void;
};

export function RepositoryDialog({ open, onOpenChange, onIndexed }: RepositoryDialogProps) {
  const [url, setUrl] = useState("");
  const { index, loading, error, clearError } = useRepositoryIndexer(onIndexed);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await index(url)) {
      setUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (loading) return;
      if (!next) clearError();
      onOpenChange(next);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-[13px] bg-secondary text-card-foreground"><GitFork className="size-5" /></div>
          <DialogTitle>Add a GitHub repository</DialogTitle>
          <DialogDescription>
            CodeScout reads up to 120 source files from the latest commit on the default branch. Public repositories only.
          </DialogDescription>
        </DialogHeader>

        <form id="repository-form" onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="github.com/owner/repository"
            aria-label="GitHub repository URL"
            className="h-11 rounded-xl text-base sm:text-sm"
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
          />
          {error && <p key={error} role="alert" className="flex animate-enter items-start gap-1.5 text-[13px] text-destructive"><TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />{error}</p>}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="submit" form="repository-form" disabled={!url.trim() || loading}>
            {loading ? <Spinner /> : <Plus />}
            {loading ? "Indexing repository…" : "Add repository"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
