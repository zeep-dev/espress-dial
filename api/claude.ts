import type { IncomingMessage, ServerResponse } from "node:http";

export const config = {
  runtime: "nodejs",
  // Allow large base64-encoded image payloads through Vercel's body parser.
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
  maxDuration: 60,
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse
): Promise<void> {
  const send = (status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
  };

  if (req.method !== "POST") {
    send(405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    send(500, { error: "ANTHROPIC_API_KEY is not set" });
    return;
  }

  let payload: { messages?: unknown; system?: string };
  try {
    const raw = await readRawBody(req);
    payload = JSON.parse(raw);
  } catch {
    send(400, { error: "Invalid JSON body" });
    return;
  }

  const { messages, system } = payload;

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages,
  };
  if (system) body.system = system;

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.text();
  send(upstream.status, data);
}
