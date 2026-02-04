import { NextResponse } from "next/server";
import OpenAI from "openai";

import type { GatekeeperInput } from "@/core/gatekeeper/types";
import type { AiPrecheckResponse } from "@/core/ai-guard/types";

import { buildAiPrecheckPrompt, finalizeAiPrecheck } from "@/core/ai-guard/aiGuard";
import { aiPrecheckJsonSchema } from "@/core/ai-guard/schema";

function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
}

export async function POST(req: Request) {
  const raw = (await req.json()) as GatekeeperInput;

  // 1) Нет ключа — не падаем, возвращаем детерминированный итог
  if (!hasOpenAIKey()) {
    const result: AiPrecheckResponse = finalizeAiPrecheck(raw, null);
    return NextResponse.json(result);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const prompt = buildAiPrecheckPrompt(raw);

  try {
  const resp = await client.responses.create({
  model,
  temperature: 0,
  max_output_tokens: 800,
  input: `You are an AI precheck layer.
Return ONLY valid JSON that matches the provided schema.
No markdown. No extra keys.

${prompt}`,
  response_format: {
    type: "json_schema",
    json_schema: aiPrecheckJsonSchema,
  },
} as any);

    const text = (resp.output_text ?? "").trim();
    if (!text) {
      const result: AiPrecheckResponse = finalizeAiPrecheck(raw, null);
      return NextResponse.json(result);
    }

    const parsed = JSON.parse(text) as AiPrecheckResponse;

    // Финализация всегда через finalize
    const result: AiPrecheckResponse = finalizeAiPrecheck(raw, parsed);
    return NextResponse.json(result);
  } catch {
    const result: AiPrecheckResponse = finalizeAiPrecheck(raw, null);
    return NextResponse.json(result);
  }
}