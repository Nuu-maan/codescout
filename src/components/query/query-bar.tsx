"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { ArrowUp, GitBranch, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

type QueryBarProps = {
  submitting: boolean;
  onSubmit: (question: string) => Promise<void>;
  repositoryName: string;
};

export function QueryBar({ submitting, onSubmit, repositoryName }: QueryBarProps) {
  const [value, setValue] = useState("");

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
        aria-label="Question about the repository"
        className="max-h-40 min-h-14 resize-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center gap-2 px-2 pb-1">
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><GitBranch className="size-3" /> repository context</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><ScanSearch className="size-3" /> Snap routing</span>
        <Button type="submit" size="icon-sm" className="ms-auto rounded-full" disabled={!value.trim() || submitting} aria-label={submitting ? "Analyzing" : "Send question"}>
          {submitting ? <Spinner /> : <ArrowUp />}
        </Button>
      </div>
    </form>
  );
}
