"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { ArrowUp, ChevronDown, KeyRound, Stop } from "@/components/ui/icons";
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
    <form onSubmit={handleSubmit} className="rounded-[22px] bg-card p-2 shadow-raised transition-shadow duration-200 ease-out-quint focus-within:shadow-popover" aria-label="Ask about repository">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Ask anything about ${repositoryName}`}
        maxLength={4_000}
        aria-label="Question about the repository"
        className="max-h-40 min-h-14 resize-none border-0 bg-transparent px-3 py-2.5 text-base text-card-foreground shadow-none focus-visible:ring-0 sm:text-[15px] dark:bg-transparent"
      />
      <div className="flex items-center gap-2 px-2 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 max-w-48 gap-1 rounded-[10px] px-2 text-[12px] font-normal text-muted-foreground" disabled={submitting}>
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
        {hasPersonalKey && <span className="inline-flex animate-enter items-center gap-1 text-[11px] text-success"><KeyRound className="size-3" /> your key</span>}
        {submitting ? (
          <Button type="button" size="icon-sm" className="ms-auto rounded-full" onClick={onStop} aria-label="Stop answer">
            <Stop className="animate-icon-in" />
          </Button>
        ) : (
          <Button type="submit" size="icon-sm" className="ms-auto rounded-full" disabled={!value.trim()} aria-label="Send question">
            <ArrowUp className="animate-icon-in" />
          </Button>
        )}
      </div>
    </form>
  );
}
