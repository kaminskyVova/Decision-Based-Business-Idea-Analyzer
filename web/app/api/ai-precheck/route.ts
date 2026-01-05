import { NextResponse } from "next/server";
import type { AIPrecheckResult } from "../../../src/ui/viewModel";
import type { GatekeeperInput } from "@/core/gatekeeper/types";
import { normalizeText } from "@/core/gatekeeper/validators";

export async function POST(req: Request) {
  const raw = (await req.json()) as GatekeeperInput;

  // v0 заглушка: нормализуем текст и делаем минимальный reality-filter
  const problem = typeof raw.problem === "string" ? normalizeText(raw.problem) : "";
  const goal = typeof raw.goal === "string" ? normalizeText(raw.goal) : "";
  const region = typeof raw.region === "string" ? normalizeText(raw.region) : "";
  const capital = raw.capital ?? "";
  const time_horizon = typeof raw.time_horizon === "string" ? normalizeText(raw.time_horizon) : "";

  const combined = '${problem} ${goal}'.toLowerCase();
  const fantasy = ["на луну", "марс", "телепортац", "100% без риска", "гарантированно"];
  const isBullshit = fantasy.some((m) => combined.includes(m));

  const result: AIPrecheckResult = {
    normalized: { problem, goal, region, capital, time_horizon },
    reality: {
      verdict: isBullshit ? "BULLSHIT" : "OK",
      reasons: isBullshit ? ["Цель/контекст противоречат ограничениям реального мира."] : [],
      confidence: isBullshit ? 0.9 : 0.7,
    },
    clarification: {
      required: false,
      questions: [],
    },
    notes: [],
  };

  return NextResponse.json(result);
}