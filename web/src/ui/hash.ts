import type { GatekeeperInput } from "../core/gatekeeper/types";

export function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as any).sort());
}

export function hashInputForAdmit(input: GatekeeperInput): string {
  // Хэшируем только то, что влияет на допуск
  const payload = {
    problem: input.problem ?? "",
    goal: input.goal ?? "",
    region: input.region ?? "",
    capital: input.capital ?? "",
    time_horizon: input.time_horizon ?? "",
    responsibility_confirmed: Boolean(input.responsibility_confirmed),
    production_related: Boolean(input.production_related),
  };
  // Для v1 достаточно стабильной строки (крипто-хэш необязателен)
  return stableStringify(payload);
}