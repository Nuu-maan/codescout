import { getOpenRouterKey, getOpenRouterModel } from "@/lib/openrouter";
import { createSubQHeaders, SUBQ_API_URL } from "@/lib/subq";

export async function GET() {
  const openRouterConfigured = Boolean(getOpenRouterKey());

  try {
    const response = await fetch(`${SUBQ_API_URL}/models`, {
      headers: createSubQHeaders(),
      cache: "no-store",
    });
    const payload = response.ok
      ? ((await response.json()) as { data?: Array<{ id: string }> })
      : null;
    const snapAvailable = payload?.data?.some(({ id }) => id === "subq-snap-preview") ?? false;

    return Response.json({
      available: snapAvailable && openRouterConfigured,
      snapAvailable,
      openRouterConfigured,
      responseModel: getOpenRouterModel(),
    });
  } catch {
    return Response.json({
      available: false,
      snapAvailable: false,
      openRouterConfigured,
      responseModel: getOpenRouterModel(),
    });
  }
}
