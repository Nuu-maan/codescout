"use client";

import { useState } from "react";
import { ChevronRight, FileCode2, Folder, FolderOpen } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "cn";
import type { FileNode } from "@/types/workspace";

type FileTreeProps = {
  nodes: FileNode[];
  selectedPath: string;
  onSelect: (path: string) => void;
  depth?: number;
};

export function FileTree({ nodes, selectedPath, onSelect, depth = 0 }: FileTreeProps) {
  return (
    <div role="tree" aria-label={depth === 0 ? "Repository files" : undefined}>
      {nodes.map((node) =>
        node.type === "folder" ? (
          <FolderRow
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={depth}
          />
        ) : (
          <Button
            key={node.path}
            variant="ghost"
            size="sm"
            role="treeitem"
            aria-selected={selectedPath === node.path}
            className={cn(
              "h-8 w-full justify-start gap-2 rounded-[10px] px-2 font-normal text-muted-foreground active:not-aria-[haspopup]:scale-[0.98]",
              selectedPath === node.path && "bg-secondary text-card-foreground",
            )}
            style={{ paddingInlineStart: `${depth * 14 + 8}px` }}
            onClick={() => onSelect(node.path)}
          >
            <FileCode2 className="size-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">{node.name}</span>
          </Button>
        ),
      )}
    </div>
  );
}

function FolderRow({ node, selectedPath, onSelect, depth }: Omit<FileTreeProps, "nodes" | "depth"> & { node: FileNode; depth: number }) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex h-8 w-full items-center gap-1.5 rounded-[10px] px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:bg-accent hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-ring"
        style={{ paddingInlineStart: `${depth * 14 + 6}px` }}
      >
        <ChevronRight className={cn("size-3 transition-transform duration-150", open && "rotate-90")} />
        {open ? <FolderOpen className="size-3.5" strokeWidth={1.6} /> : <Folder className="size-3.5" strokeWidth={1.6} />}
        <span className="truncate">{node.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FileTree nodes={node.children ?? []} selectedPath={selectedPath} onSelect={onSelect} depth={depth + 1} />
      </CollapsibleContent>
    </Collapsible>
  );
}
