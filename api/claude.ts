export const config = {
  runtime: "edge",
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const apiKey = (globalThis as any).ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let payload: { messages?: unknown; system?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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
  return new Response(data, {
    status: upstream.status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
