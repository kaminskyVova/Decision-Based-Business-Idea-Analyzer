import type { GatekeeperInput, ProjectType, RegionInput, RequestType } from "./types";

export function isBlankString(v: unknown): boolean {
  return typeof v !== "string" || v.trim().length === 0;
}

export function normalizeText(v: string): string {
  return v.trim().replace(/\s+/g, " ");
}

export function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return false;
}

/**
 * Мягкий парсер капитала:
 * - принимает "100000", "100 000", "100k", "100к", "до 100000", "≈ 200000"
 * - принимает также number
 * - возвращает число, если удалось; иначе null
 */
export function parseCapitalToNumber(capital?: string | number): number | null {
  if (capital === null || capital === undefined) return null;

  if (typeof capital === "number") {
    return Number.isFinite(capital) ? Math.round(capital) : null;
  }

  const s = capital
    .toLowerCase()
    .replace(/[,]/g, ".")
    .replace(/₽|руб\.?|rur|rub/gi, "")
    .trim();

  // 100k / 100к
  const kMatch = s.match(/(\d+(\.\d+)?)\s*(k|к)\b/);
  if (kMatch) {
    const n = Number(kMatch[1]);
    return Number.isFinite(n) ? Math.round(n * 1000) : null;
  }

  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;

  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

// ---- Region rules (UI v2) ----
export function validateRegion(region: RegionInput, projectType: ProjectType, production: boolean) {
  const countryOk = !isBlankString(region.country);
  const regionOk = !isBlankString(region.region);

  // city required for OFFLINE and production
  const cityRequired = projectType === "OFFLINE" || production === true;
  const cityOk = cityRequired ? !isBlankString(region.city ?? "") : true;

  return { countryOk, regionOk, cityOk, cityRequired };
}

export function minLengthOk(text: string, min: number): boolean {
  return normalizeText(text).length >= min;
}

/**
 * Собирает реально отсутствующие поля по правилам UI v2 + Gatekeeper input contract.
 */
export function collectMissingFields(input: GatekeeperInput): (keyof GatekeeperInput | "region.country" | "region.region" | "region.city")[] {
  const missing: (keyof GatekeeperInput | "region.country" | "region.region" | "region.city")[] = [];

  // request_type / project_type
  if (!input.request_type) missing.push("request_type");
  if (!input.project_type) missing.push("project_type");

  // idea / goal
  if (isBlankString(input.idea) || !minLengthOk(String(input.idea), 3)) missing.push("idea");
  if (isBlankString(input.goal) || !minLengthOk(String(input.goal), 5)) missing.push("goal");

  // conditional narrative fields
  if (input.request_type === "OPPORTUNITY") {
    if (isBlankString(input.context ?? "") || !minLengthOk(String(input.context ?? ""), 5)) missing.push("context");
  }

  if (input.request_type === "PROBLEM_SOLVING") {
    if (isBlankString(input.problem ?? "") || !minLengthOk(String(input.problem ?? ""), 10)) missing.push("problem");
  }

  // region
  const r = validateRegion(input.region, input.project_type, input.production_related);
  if (!r.countryOk) missing.push("region.country");
  if (!r.regionOk) missing.push("region.region");
  if (r.cityRequired && !r.cityOk) missing.push("region.city");

  // capital
  if (!hasValue(input.capital)) missing.push("capital");

  // mandatory expenses included must be explicitly true/false (boolean). Here we only check presence of boolean.
  // In TS it's always boolean, so no missing check.

  // responsibility_confirmed is critical (must be true to pass, but missing list uses it too)
  if (!input.responsibility_confirmed) missing.push("responsibility_confirmed");

  return missing;
}