export async function apiSend(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const response = await fetch(path, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    credentials: "include",
    headers: options.body === undefined ? undefined : { "content-type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { error: text };
    }
  }
  return { ok: response.ok, status: response.status, json };
}

export function apiError(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && "error" in json && typeof json.error === "string") return json.error;
  return fallback;
}
