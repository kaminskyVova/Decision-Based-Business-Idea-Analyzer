import type { GatekeeperInput } from "@/core/gatekeeper/types";
import { normalizeText } from "@/core/gatekeeper/validators";

export function safeNormalizeInput(raw: GatekeeperInput): Partial<GatekeeperInput> {
  const idea = typeof raw.idea === "string" ? normalizeText(raw.idea) : "";
  const goal = typeof raw.goal === "string" ? normalizeText(raw.goal) : "";

  const context = typeof raw.context === "string" ? normalizeText(raw.context) : "";
  const problem = typeof raw.problem === "string" ? normalizeText(raw.problem) : "";

  const country =
    typeof raw.region?.country === "string" ? normalizeText(raw.region.country) : "";
  const region =
    typeof raw.region?.region === "string" ? normalizeText(raw.region.region) : "";
  const city =
    typeof raw.region?.city === "string" ? normalizeText(raw.region.city) : "";

  const time_horizon =
    typeof raw.time_horizon === "string" ? normalizeText(raw.time_horizon) : undefined;

  const capital = raw.capital;

  return {
    ...raw,
    idea,
    goal,
    context: context || undefined,
    problem: problem || undefined,
    region: { country, region, city: city || undefined },
    time_horizon,
    capital,
  };
}