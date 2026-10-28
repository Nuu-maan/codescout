export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    const payload: unknown = await request.json();
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload as T : null;
  } catch {
    return null;
  }
}

const requestLog = new Map<string, number[]>();

export function rateLimit(request: Request, bucket: string, limit: number, windowMs = 60_000, now = Date.now()) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = `${bucket}:${client}`;
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    requestLog.set(key, recent);
    const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
    return Response.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  recent.push(now);
  requestLog.set(key, recent);
  if (requestLog.size > 10_000) requestLog.delete(requestLog.keys().next().value!);
  return null;
}
