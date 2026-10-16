export const openRouterKeyStorageName = "codescout.openrouter-key";

export function isValidOpenRouterKey(value: string) {
  return value.length <= 512 && /^sk-or-v1-[A-Za-z0-9_-]{16,}$/.test(value);
}
