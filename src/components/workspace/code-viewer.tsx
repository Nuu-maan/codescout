"use client";

import { Copy, ExternalLink, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { languageForPath } from "@/lib/repository";
import type { RepositorySnapshot } from "@/types/workspace";

type CodeViewerProps = {
  path: string;
  repository: RepositorySnapshot;
};

export function CodeViewer({ path, repository }: CodeViewerProps) {
  const code = repository.files[path] ?? `// ${path}\n// Source preview is not available for this file.`;
  const sourceUrl = `${repository.url}/blob/${encodeURIComponent(repository.branch)}/${path.split("/").map(encodeURIComponent).join("/")}`;

  const copyPath = async () => {
    await navigator.clipboard.writeText(path);
    toast.success("Path copied", { description: path });
  };

  return (
    <aside className="flex h-full min-h-0 flex-col bg-card/35" aria-label="Source viewer">
      <div className="flex h-12 items-center gap-2 px-3">
        <FileCode2 className="size-4 text-primary" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{path}</span>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Copy file path" onClick={copyPath}><Copy /></Button></TooltipTrigger>
          <TooltipContent>Copy path</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Open file on GitHub" asChild><a href={sourceUrl} target="_blank" rel="noreferrer"><ExternalLink /></a></Button></TooltipTrigger>
          <TooltipContent>Open on GitHub</TooltipContent>
        </Tooltip>
      </div>
      <Separator />

      <Tabs defaultValue="code" className="min-h-0 flex-1 gap-0">
        <div className="flex h-10 items-center justify-between border-b px-3">
          <TabsList variant="line" className="h-9">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">{languageForPath(path)}</Badge>
        </div>
        <TabsContent value="code" className="mt-0 h-[calc(100%-2.5rem)]">
          <ScrollArea className="h-full">
            <CodeBlock className="rounded-none border-0 bg-transparent text-xs">
              <CodeBlockContent lineNumbers startLine={1} className="min-h-full py-4">{code}</CodeBlockContent>
            </CodeBlock>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="details" className="mt-0 space-y-3 p-4 text-xs">
          <div><span className="text-muted-foreground">Repository</span><div className="mt-1 font-mono text-card-foreground">{repository.fullName}</div></div>
          <div><span className="text-muted-foreground">Path</span><div className="mt-1 break-all font-mono text-card-foreground">{path}</div></div>
          <div><span className="text-muted-foreground">Size</span><div className="mt-1 font-mono text-card-foreground">{new TextEncoder().encode(code).length.toLocaleString()} bytes</div></div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 border-t px-3 py-2 font-mono text-[10px] text-muted-foreground">
        <span>UTF-8</span><span>LF</span><span className="ms-auto">{code.split("\n").length.toLocaleString()} lines</span>
      </div>
    </aside>
  );
}
