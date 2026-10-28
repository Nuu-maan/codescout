"use client";

import { useState } from "react";
import type { RepositorySnapshot } from "@/types/workspace";

export function useRepositoryIndexer(onIndexed: (repository: RepositorySnapshot) => void) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const index = async (url: string) => {
    if (!url.trim() || pendingUrl) return false;
    setPendingUrl(url);
    setError(null);

    try {
      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json().catch(() => null)) as { repository?: RepositorySnapshot; error?: string } | null;
      if (!response.ok || !payload?.repository) throw new Error(payload?.error ?? "The repository could not be indexed.");
      onIndexed(payload.repository);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The repository could not be indexed.");
      return false;
    } finally {
      setPendingUrl(null);
    }
  };

  return { index, pendingUrl, loading: pendingUrl !== null, error, clearError: () => setError(null) };
}
