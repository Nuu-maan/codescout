import { indexPublicGitHubRepository } from "@/lib/github";
import { rateLimit, readJsonBody } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = rateLimit(request, "repositories", 6);
  if (limited) return limited;

  const payload = await readJsonBody<{ url?: unknown }>(request);
  if (typeof payload?.url !== "string") {
    return Response.json({ error: "Enter a GitHub repository URL." }, { status: 400 });
  }

  try {
    const repository = await indexPublicGitHubRepository(payload.url);
    return Response.json({ repository });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The repository could not be indexed.";
    return Response.json({ error: message }, { status: 422 });
  }
}
