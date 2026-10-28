"use client";

import { useMemo, useState } from "react";
import { Braces, ChevronsUpDown, GitBranch, GitFork, Search } from "@/components/ui/icons";
import { FileTree } from "@/components/ai-elements/file-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { FileNode, RepositorySnapshot } from "@/types/workspace";

type RepositoryPanelProps = {
  selectedPath: string;
  onSelect: (path: string) => void;
  repository: RepositorySnapshot;
  onChangeRepository: () => void;
};

export function RepositoryPanel({ selectedPath, onSelect, repository, onChangeRepository }: RepositoryPanelProps) {
  const [query, setQuery] = useState("");
  const filteredTree = useMemo(() => filterTree(repository.tree, query), [query, repository.tree]);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-sidebar" aria-label="Repository">
      <div className="space-y-3 p-3">
        <Button variant="ghost" className="h-auto w-full justify-start gap-2 p-1.5 text-left" onClick={onChangeRepository}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <GitFork className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{repository.owner} / {repository.name}</span>
            <span className="block truncate text-xs text-muted-foreground">Public repository</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 font-mono font-normal">
            <GitBranch className="size-3" /> {repository.branch}
          </Badge>
          <Badge variant="outline" className="font-mono font-normal text-muted-foreground">{repository.commit.slice(0, 7)}</Badge>
        </div>
      </div>

      <Separator />

      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a file"
            aria-label="Find a file"
            className="h-8 ps-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        {filteredTree.length ? (
          <FileTree nodes={filteredTree} selectedPath={selectedPath} onSelect={onSelect} />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Braces className="size-5 text-muted-foreground" />
            <p className="text-xs font-medium">No matching files</p>
            <Button variant="link" size="xs" onClick={() => setQuery("")}>Clear search</Button>
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span title={repository.truncated ? "Large repository. Root files and source folders were indexed first." : undefined}>
            {repository.fileCount} files{repository.truncated && " · partial"}
          </span>
          <span className="font-mono">{formatBytes(repository.indexedBytes)} indexed</span>
        </div>
      </div>
    </aside>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;

  return nodes.flatMap((node) => {
    if (node.type === "file") {
      return node.path.toLowerCase().includes(normalized) ? [node] : [];
    }

    const children = filterTree(node.children ?? [], query);
    return children.length ? [{ ...node, children }] : [];
  });
}
