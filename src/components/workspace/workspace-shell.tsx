"use client";

import { useEffect, useState } from "react";
import { Braces, Files, Plus, Settings2 } from "lucide-react";
import { AnalysisWorkspace } from "@/components/query/analysis-workspace";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeViewer } from "@/components/workspace/code-viewer";
import { RepositoryDialog } from "@/components/workspace/repository-dialog";
import { RepositoryPanel } from "@/components/workspace/repository-panel";
import { defaultRepository } from "@/lib/demo-data";
import type { RepositorySnapshot } from "@/types/workspace";

export function WorkspaceShell() {
  const [repository, setRepository] = useState(defaultRepository);
  const [selectedPath, setSelectedPath] = useState(Object.keys(defaultRepository.files)[0]);
  const [repositoryDialogOpen, setRepositoryDialogOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<{
    available: boolean;
    snapAvailable: boolean;
    openRouterConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((payload: { available?: boolean; snapAvailable?: boolean; openRouterConfigured?: boolean }) => {
        setPipelineStatus({
          available: payload.available === true,
          snapAvailable: payload.snapAvailable === true,
          openRouterConfigured: payload.openRouterConfigured === true,
        });
      })
      .catch(() => setPipelineStatus({ available: false, snapAvailable: false, openRouterConfigured: false }));
  }, []);

  const openSource = (path: string) => {
    setSelectedPath(path);
    setFilesOpen(false);
    setSourceOpen(true);
  };

  const useRepository = (nextRepository: RepositorySnapshot) => {
    setRepository(nextRepository);
    setSelectedPath(Object.keys(nextRepository.files)[0]);
    setSourceOpen(false);
    setFilesOpen(false);
  };

  return (
    <div className="flex h-dvh min-h-[40rem] flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center border-b bg-card px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Braces className="size-4" strokeWidth={2.25} /></div>
          <span className="text-sm font-semibold tracking-[-0.02em]">CodeScout</span>
          <Badge variant="secondary" className="hidden font-mono text-[9px] sm:inline-flex">REPOSITORY INTELLIGENCE</Badge>
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1.5 px-2 font-normal text-muted-foreground">
            <span className={`size-1.5 rounded-full ${pipelineStatus === null ? "bg-muted-foreground" : pipelineStatus.available ? "bg-emerald-500" : "bg-destructive"}`} />
            <span className="hidden md:inline">{getPipelineLabel(pipelineStatus)}</span>
          </Badge>
          <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Repository settings"><Settings2 /></Button></TooltipTrigger>
            <TooltipContent>Repository settings</TooltipContent>
          </Tooltip>
          <Button size="sm" className="pressable gap-1.5" onClick={() => setRepositoryDialogOpen(true)}><Plus className="size-3.5" /><span className="hidden sm:inline">Add repository</span></Button>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Browse repository files" onClick={() => setFilesOpen(true)}><Files /></Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 border-r lg:block">
          <RepositoryPanel repository={repository} selectedPath={selectedPath} onSelect={openSource} onChangeRepository={() => setRepositoryDialogOpen(true)} />
        </div>
        <AnalysisWorkspace
          key={repository.id}
          repository={repository}
          onOpenSource={openSource}
          onOpenFiles={() => setFilesOpen(true)}
          onChangeRepository={() => setRepositoryDialogOpen(true)}
        />
      </div>

      <Sheet open={filesOpen} onOpenChange={setFilesOpen}>
        <SheetContent side="left" className="w-[min(92vw,22rem)] p-0 sm:max-w-none">
          <SheetHeader className="sr-only"><SheetTitle>Repository files</SheetTitle><SheetDescription>Browse indexed repository files</SheetDescription></SheetHeader>
          <RepositoryPanel repository={repository} selectedPath={selectedPath} onSelect={openSource} onChangeRepository={() => setRepositoryDialogOpen(true)} />
        </SheetContent>
      </Sheet>

      <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
        <SheetContent side="right" className="w-[min(96vw,48rem)] p-0 sm:max-w-none">
          <SheetHeader className="sr-only"><SheetTitle>Source viewer</SheetTitle><SheetDescription>Inspect cited source code</SheetDescription></SheetHeader>
          <CodeViewer path={selectedPath} repository={repository} />
        </SheetContent>
      </Sheet>

      <RepositoryDialog open={repositoryDialogOpen} onOpenChange={setRepositoryDialogOpen} onIndexed={useRepository} />
      <div className="sr-only" aria-live="polite">{getPipelineLabel(pipelineStatus)}</div>
    </div>
  );
}

function getPipelineLabel(status: { available: boolean; snapAvailable: boolean; openRouterConfigured: boolean } | null) {
  if (!status) return "Checking pipeline";
  if (status.available) return "Models ready";
  if (!status.snapAvailable) return "SubQ Snap unavailable";
  if (!status.openRouterConfigured) return "OpenRouter key needed";
  return "Pipeline unavailable";
}
