import type { GatekeeperInput } from "./types";

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

  // вытащим все цифры
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;

  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/**
 * Базовая проверка: регион должен содержать хотя бы 2 слова
 * (грубый суррогат "страна город" — достаточно для Gatekeeper v1)
 */
export function looksLikeRegion(region: string): boolean {
  const r = normalizeText(region);
  const parts = r.split(" ").filter(Boolean);
  return parts.length >= 2 && r.length >= 5;
}

export function minLengthOk(text: string, min: number): boolean {
  return normalizeText(text).length >= min;
}

/**
 * Возвращает список реально отсутствующих полей.
 * ВАЖНО: capital считается заполненным, если это число или непустая строка.
 */
export function collectMissingFields(input: GatekeeperInput): (keyof GatekeeperInput)[] {
  const missing: (keyof GatekeeperInput)[] = [];

  if (isBlankString(input.problem)) missing.push("problem");
  if (isBlankString(input.goal)) missing.push("goal");
  if (isBlankString(input.region)) missing.push("region");

  // responsibility_confirmed — критично
  if (!input.responsibility_confirmed) missing.push("responsibility_confirmed");

  // time_horizon — строка
  if (!hasValue(input.time_horizon) || isBlankString(input.time_horizon)) {
    missing.push("time_horizon");
  }

  // capital — string | number
  if (!hasValue(input.capital)) missing.push("capital");

  return missing;
}
