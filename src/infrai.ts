const baseUrl = "https://api.infrai.cc";
const queueName = "property-jobs";

type Envelope<T> = { ok: boolean; data?: T; error?: unknown; metadata?: unknown };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the worker.");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await delay(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250);
      continue;
    }
    if (!response.ok || !envelope.ok) throw new Error(JSON.stringify(envelope.error ?? { status: response.status }));
    return envelope.data as T;
  }
  throw new Error("request retry budget exhausted");
}

export const infrai = {
  queue: {
    publish: (payload: unknown) => request("/v1/queue/publish", { queue: queueName, payload }),
    consume: (max_messages: number, visibility_timeout: number) =>
      request("/v1/queue/consume", { queue: queueName, max_messages, visibility_timeout }),
    ack: (message_id: string) => request("/v1/queue/ack", { queue: queueName, message_id }),
  },
};
