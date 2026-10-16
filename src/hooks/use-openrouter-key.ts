"use client";

import { useSyncExternalStore } from "react";
import { openRouterKeyStorageName } from "@/lib/openrouter-key";

const keyChangeEvent = "codescout:openrouter-key-change";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(keyChangeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(keyChangeEvent, listener);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(openRouterKeyStorageName) ?? "";
  } catch {
    return "";
  }
}

export function useOpenRouterKey() {
  const key = useSyncExternalStore(subscribe, getSnapshot, () => "");

  const saveKey = (value: string) => {
    try {
      if (value) window.localStorage.setItem(openRouterKeyStorageName, value);
      else window.localStorage.removeItem(openRouterKeyStorageName);
      window.dispatchEvent(new Event(keyChangeEvent));
      return true;
    } catch {
      return false;
    }
  };

  return { key, saveKey };
}
