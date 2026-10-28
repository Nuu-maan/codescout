"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { ArrowUp, BrainCircuit, ChevronDown, GitBranch, KeyRound, ScanSearch, Stop } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { getResponseModel, responseModels, type ResponseModelId } from "@/lib/models";

type QueryBarProps = {
  submitting: boolean;
  onSubmit: (question: string) => Promise<void>;
  onStop: () => void;
  model: ResponseModelId;
  onModelChange: (model: ResponseModelId) => void;
  hasPersonalKey: boolean;
  repositoryName: string;
};

export function QueryBar({ submitting, onSubmit, onStop, model, onModelChange, hasPersonalKey, repositoryName }: QueryBarProps) {
  const [value, setValue] = useState("");
  const selectedModel = getResponseModel(model);

  const submit = () => {
    const question = value.trim();
    if (!question || submitting) return;
    setValue("");
    void onSubmit(question);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-2 shadow-[0_8px_30px_oklch(0_0_0/0.08)] focus-within:border-foreground/20" aria-label="Ask about repository">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Ask anything about ${repositoryName}`}
        maxLength={4_000}
        aria-label="Question about the repository"
        className="max-h-40 min-h-14 resize-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center gap-2 px-2 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 max-w-48 gap-1 rounded-md px-1.5 text-[10px] font-normal text-muted-foreground" disabled={submitting}>
              <BrainCircuit className="size-3" />
              <span className="truncate">{selectedModel.name}</span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-72">
            <DropdownMenuLabel>Response model</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={model} onValueChange={(value) => {
              if (responseModels.some(({ id }) => id === value)) onModelChange(value as ResponseModelId);
            }}>
              {responseModels.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id} className="items-start py-2">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {option.name}
                      <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-normal text-muted-foreground">{option.access}</span>
                    </span>
                    <span className="block text-[10px] text-muted-foreground">{option.provider}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasPersonalKey && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400"><KeyRound className="size-3" /> your key</span>}
        <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:inline-flex"><GitBranch className="size-3" /> repository context</span>
        <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:inline-flex"><ScanSearch className="size-3" /> Snap routing</span>
        {submitting ? (
          <Button type="button" size="icon-sm" className="pressable ms-auto rounded-full" onClick={onStop} aria-label="Stop answer">
            <Stop />
          </Button>
        ) : (
          <Button type="submit" size="icon-sm" className="pressable ms-auto rounded-full" disabled={!value.trim()} aria-label="Send question">
            <ArrowUp />
          </Button>
        )}
      </div>
    </form>
  );
}
