import type { GatekeeperInput, GatekeeperResult, ReasonCode } from "./types";
import { collectMissingFields, normalizeText, parseCapitalToNumber } from "./validators";
import { validateMeaningfulText, issueToNote } from "./validators_text";

/**
 * Gatekeeper v2 (минимальная рабочая версия под UI v2).
 * Детерминированная функция. Без I/O.
 */
export function runGatekeeper(raw: GatekeeperInput): GatekeeperResult {
  const reason_codes: ReasonCode[] = [];

  const input: GatekeeperInput = {
    ...raw,
    idea: typeof raw.idea === "string" ? normalizeText(raw.idea) : "",
    goal: typeof raw.goal === "string" ? normalizeText(raw.goal) : "",
    context: typeof raw.context === "string" ? normalizeText(raw.context) : raw.context,
    problem: typeof raw.problem === "string" ? normalizeText(raw.problem) : raw.problem,
    region: {
      country: typeof raw.region?.country === "string" ? normalizeText(raw.region.country) : "",
      region: typeof raw.region?.region === "string" ? normalizeText(raw.region.region) : "",
      city: typeof raw.region?.city === "string" ? normalizeText(raw.region.city) : raw.region?.city,
    },
    responsibility_confirmed: Boolean(raw.responsibility_confirmed),
    production_related: Boolean(raw.production_related),
    mandatory_expenses_included: Boolean(raw.mandatory_expenses_included),
    time_horizon: typeof raw.time_horizon === "string" ? normalizeText(raw.time_horizon) : raw.time_horizon,
  };

  // ---- Missing fields → RETURN_WITH_CONDITIONS ----
  const missing = collectMissingFields(input);
  if (missing.length > 0) {
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage:
        missing.includes("request_type") || missing.includes("project_type") ? "REQUEST"
          : missing.includes("idea") ? "IDEA"
          : missing.includes("context") ? "CONTEXT"
          : missing.includes("problem") ? "PROBLEM"
          : missing.some((m) => String(m).startsWith("region.")) || missing.includes("capital") ? "CONSTRAINTS"
          : missing.includes("goal") ? "GOAL"
          : "CONSTRAINTS",
      reason_codes,
      missing_fields: missing,
      notes: ["Не все обязательные поля заполнены. Требуется уточнение данных."],
    };
  }

  // ===================================================================
  // Anti-gibberish (детерминированно, без AI).
  // Формально заполнено ≠ валидно.
  // ===================================================================

  // idea: допускаем 1 слово ("Химчистка"), но не мусор/не цифры/не повторы
  const ideaCheck = validateMeaningfulText(input.idea, { minLen: 2, minTokens: 1 });
  if (!ideaCheck.ok) {
    reason_codes.push("RC-01");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "IDEA",
      reason_codes,
      missing_fields: ["idea"],
      notes: [issueToNote("idea", ideaCheck.issue)],
    };
  }

  // goal: лучше требовать фразу (2+ слов), иначе слишком пусто.
  // Если хочешь разрешить 1 слово — поставь minTokens: 1
  const goalCheck = validateMeaningfulText(input.goal, { minLen: 3, minTokens: 2 });
  if (!goalCheck.ok) {
    reason_codes.push("RC-02");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "GOAL",
      reason_codes,
      missing_fields: ["goal"],
      notes: [issueToNote("goal", goalCheck.issue)],
    };
  }

  // context/problem: зависит от request_type
  if (input.request_type === "OPPORTUNITY") {
    const ctxCheck = validateMeaningfulText(input.context, { minLen: 5, minTokens: 2 });
    if (!ctxCheck.ok) {
      reason_codes.push("RC-01");
      return {
        decision: "RETURN_WITH_CONDITIONS",
        stage: "CONTEXT",
        reason_codes,
        missing_fields: ["context"],
        notes: [issueToNote("context", ctxCheck.issue)],
      };
    }
  } else {
    const prCheck = validateMeaningfulText(input.problem, { minLen: 5, minTokens: 2 });
    if (!prCheck.ok) {
      reason_codes.push("RC-01");
      return {
        decision: "RETURN_WITH_CONDITIONS",
        stage: "PROBLEM",
        reason_codes,
        missing_fields: ["problem"],
        notes: [issueToNote("problem", prCheck.issue)],
      };
    }
  }

  // region: country/region всегда нужны, city обязателен для OFFLINE
  const countryCheck = validateMeaningfulText(input.region?.country, { minLen: 2, minTokens: 1 });
  if (!countryCheck.ok) {
    reason_codes.push("RC-06");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "CONSTRAINTS",
      reason_codes,
      missing_fields: ["region.country"],
      notes: [issueToNote("region.country", countryCheck.issue)],
    };
  }

  const regionCheck = validateMeaningfulText(input.region?.region, { minLen: 2, minTokens: 1 });
  if (!regionCheck.ok) {
    reason_codes.push("RC-06");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "CONSTRAINTS",
      reason_codes,
      missing_fields: ["region.region"],
      notes: [issueToNote("region.region", regionCheck.issue)],
    };
  }

  const cityAllowEmpty = input.project_type === "ONLINE";
  const cityCheck = validateMeaningfulText(input.region?.city, { minLen: 2, minTokens: 1, allowEmpty: cityAllowEmpty });
  if (!cityCheck.ok) {
    reason_codes.push("RC-06");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "CONSTRAINTS",
      reason_codes,
      missing_fields: ["region.city"],
      notes: [issueToNote("region.city", cityCheck.issue)],
    };
  }

  // time_horizon: опционально, но если заполнено мусором — возвращаем на уточнение (RC-08)
  if (typeof input.time_horizon === "string" && input.time_horizon.trim().length > 0) {
    // тут не "смысл", а просто защита от мусора
    const th = validateMeaningfulText(input.time_horizon, { minLen: 2, minTokens: 1 });
    if (!th.ok) {
      reason_codes.push("RC-08");
      return {
        decision: "RETURN_WITH_CONDITIONS",
        stage: "CONSTRAINTS",
        reason_codes,
        missing_fields: ["time_horizon"],
        notes: [issueToNote("time_horizon", th.issue)],
      };
    }
  }

  // ---- Responsibility ----
  if (!input.responsibility_confirmed) {
    reason_codes.push("RC-03");
    return {
      decision: "HARD_FAIL",
      stage: "RESPONSIBILITY",
      reason_codes,
      missing_fields: ["responsibility_confirmed"],
      notes: ["Без принятия ответственности анализ запрещён."],
    };
  }

  // ---- Reality check (минимум; полноценный RC-04 вынесем позже отдельным модулем) ----
  // FIX: toLowerCase() применяем к полной строке
  const combined = `(
    ${input.idea} ${input.goal} ${String(input.context ?? "")} ${String(input.problem ?? "")}
  ).toLowerCase()`;

  const fantasy = ["на луну", "марс", "телепортац", "вечный двигатель", "100% без риска", "гарантирован"];
  if (fantasy.some((m) => combined.includes(m))) {
    reason_codes.push("RC-04");
    return {
      decision: "HARD_FAIL",
      stage: "REALITY",
      reason_codes,
      missing_fields: [],
      notes: ["Обнаружены признаки нереалистичного/фантастического сценария."],
    };
  }

  // ---- Legality (минимум) ----
  const illegalMarkers = ["обойти закон", "без документов", "нелегально", "серый", "отмыв", "контрабанд", "взлом"];
  if (illegalMarkers.some((m) => combined.includes(m))) {
    reason_codes.push("RC-05");
    return {
      decision: "HARD_FAIL",
      stage: "LEGALITY",
      reason_codes,
      missing_fields: [],
      notes: ["Обнаружены признаки незаконной деятельности."],
    };
  }

  // ---- Production resource fit ----
  if (input.production_related) {
    const cap = parseCapitalToNumber(input.capital);
    if (cap === null) {
      reason_codes.push("RC-07");
      return {
        decision: "RETURN_WITH_CONDITIONS",
        stage: "RESOURCE_FIT",
        reason_codes,
        missing_fields: ["capital"],
        notes: ["Капитал указан в непарсируемом формате. Уточни сумму или диапазон."],
      };
    }
    if (cap < 100_000) {
      reason_codes.push("RC-09");
      return {
        decision: "RETURN_WITH_CONDITIONS",
        stage: "RESOURCE_FIT",
        reason_codes,
        missing_fields: [],
        notes: ["Производственный кейс: капитал выглядит недостаточным для базового входа (v1 порог 100 000)."],
      };
    }
  }

  // ---- ADMITTED ----
  return {
    decision: "ADMITTED",
    stage: "RESOURCE_FIT",
    reason_codes,
    missing_fields: [],
    notes: ["Gatekeeper пройден. Допуск к Analysis разрешён."],
  };
}