export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    const payload: unknown = await request.json();
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload as T : null;
  } catch {
    return null;
  }
}
