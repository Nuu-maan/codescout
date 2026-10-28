"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Trash2 } from "@/components/ui/icons";
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
import { isValidOpenRouterKey } from "@/lib/openrouter-key";

type OpenRouterKeyDialogProps = {
  initialKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (key: string) => void;
};

export function OpenRouterKeyDialog({ initialKey, open, onOpenChange, onSave }: OpenRouterKeyDialogProps) {
  const [value, setValue] = useState(initialKey);
  const [visible, setVisible] = useState(false);
  const trimmedValue = value.trim();
  const valid = isValidOpenRouterKey(trimmedValue);

  const save = () => {
    if (!valid) return;
    onSave(trimmedValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-[13px] bg-secondary text-card-foreground"><KeyRound className="size-5" /></div>
          <DialogTitle>Use your OpenRouter key</DialogTitle>
          <DialogDescription>Your key is saved only in this browser and sent with repository questions. It is never added to GitHub or synced to CodeScout.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="relative">
            <Input
              type={visible ? "text" : "password"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") save();
              }}
              placeholder="sk-or-v1-…"
              autoComplete="off"
              spellCheck={false}
              className="h-10 rounded-xl pe-10 font-mono text-base sm:text-xs"
              aria-label="OpenRouter API key"
            />
            <Button type="button" variant="ghost" size="icon-sm" className="absolute end-1.5 top-1.5" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide API key" : "Show API key"}>
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {trimmedValue && !valid && <p className="animate-enter text-xs text-destructive">Enter a valid OpenRouter key beginning with sk-or-v1-.</p>}
          <p className="text-xs text-muted-foreground">Remove it before using CodeScout on a shared computer.</p>
        </div>

        <DialogFooter>
          {initialKey && <Button variant="ghost" className="me-auto text-destructive hover:text-destructive" onClick={() => onSave("")}><Trash2 /> Remove key</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid} onClick={save}>Save key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
