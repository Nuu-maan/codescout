"use client";

import { Copy, ExternalLink, FileCode2 } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent, CodeBlockLine } from "@/components/ui/code-block";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import { languageForPath } from "@/lib/repository";
import type { RepositorySnapshot } from "@/types/workspace";

type CodeViewerProps = {
  path: string;
  repository: RepositorySnapshot;
};

export function CodeViewer({ path, repository }: CodeViewerProps) {
  const code = repository.files[path] ?? "";
  const lines = useHighlightedCode(code, path.split(".").pop() ?? "");
  const sourceUrl = `${repository.url}/blob/${repository.commit}/${path.split("/").map(encodeURIComponent).join("/")}`;

  const copyPath = () => {
    navigator.clipboard.writeText(path).then(
      () => toast.success("Path copied", { description: path }),
      () => toast.error("This browser blocked clipboard access"),
    );
  };

  return (
    <aside className="flex h-full min-h-0 flex-col" aria-label="Source viewer">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b ps-4 pe-12">
        <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium text-card-foreground" title={path}>{path}</span>
        <span className="hidden h-6 items-center rounded-[6px] bg-secondary px-1.5 font-mono text-[11px] sm:inline-flex">{languageForPath(path)}</span>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Copy file path" onClick={copyPath}><Copy /></Button></TooltipTrigger>
          <TooltipContent>Copy path</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Open file on GitHub" asChild><a href={sourceUrl} target="_blank" rel="noreferrer"><ExternalLink /></a></Button></TooltipTrigger>
          <TooltipContent>Open on GitHub</TooltipContent>
        </Tooltip>
      </div>

      <CodeBlock className="min-h-0 flex-1 rounded-none border-0 bg-transparent text-xs">
        <CodeBlockContent lineNumbers className="h-full py-4">
          {lines.map((line, index) => <CodeBlockLine key={index}>{line}</CodeBlockLine>)}
        </CodeBlockContent>
      </CodeBlock>

      <div className="flex shrink-0 items-center justify-between border-t px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <span className="truncate">{repository.fullName} @ {repository.commit.slice(0, 7)}</span>
        <span className="shrink-0 tabular-nums">{lines.length.toLocaleString("en-US")} lines</span>
      </div>
    </aside>
  );
}
