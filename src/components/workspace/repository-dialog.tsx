"use client";

import { FormEvent, useState } from "react";
import { GitFork, LockKeyhole, Plus, ScanLine } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-secondary"><GitFork className="size-5" /></div>
          <DialogTitle>Add a GitHub repository</DialogTitle>
          <DialogDescription>
            CodeScout reads up to 120 source files from the latest commit on the default branch.
          </DialogDescription>
        </DialogHeader>

        <form id="repository-form" onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="github.com/owner/repository"
            aria-label="GitHub repository URL"
            className="h-11 text-base sm:text-sm"
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
          />
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/65 p-2.5"><ScanLine className="size-3.5" /> Source and config files</div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/65 p-2.5"><LockKeyhole className="size-3.5" /> Public repositories only</div>
          </div>
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
